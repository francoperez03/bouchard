"""
API Server embebido para el robot Bouchard.
Corre en un daemon thread dentro del proceso Webots.
Expone estado via WebSocket y acepta comandos via REST.
"""
import asyncio
import json
import os
import threading
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Any

# Puerto configurable via variable de entorno
API_PORT = int(os.environ.get("BOUCHARD_API_PORT", "8765"))

# Funciones validas para comandos remotos
COMMAND_WHITELIST = {"avanzar", "retroceder", "girar", "frenar", "set_velocidad", "set_mode"}


class SharedState:
    """Estado thread-safe compartido entre el main loop y el servidor API."""

    def __init__(self):
        self._lock = threading.Lock()
        self._data: dict[str, Any] = {
            "sensors": {},
            "reflex": {"emergency": False, "velocity": 0, "heading_override": None, "description": ""},
            "strategy": {"has_action": False, "target_heading": None, "target_speed": None, "description": ""},
            "map": {"size": "3.0x3.0m", "resolution": "0.05m", "explored_pct": 0, "frontier_count": 0, "frontiers": [], "obstacles_sample": [], "terrain_zones": {}},
            "step": 0,
            "claude_calls": 0,
            "mode": "autonomous",
        }
        self._command_results: list[dict] = []

    def update(self, sensor_data: dict, reflex_result, strategy_result, map_data: dict,
               step_count: int, claude_calls: int, mode: str):
        """Actualiza el estado. Llamado desde el main loop cada step."""
        with self._lock:
            self._data["sensors"] = sensor_data
            self._data["reflex"] = {
                "emergency": getattr(reflex_result, "emergency", False),
                "velocity": getattr(reflex_result, "velocity", 0),
                "heading_override": getattr(reflex_result, "heading_override", None),
                "description": getattr(reflex_result, "description", ""),
            }
            self._data["strategy"] = {
                "has_action": getattr(strategy_result, "has_action", False),
                "target_heading": getattr(strategy_result, "target_heading", None),
                "target_speed": getattr(strategy_result, "target_speed", None),
                "description": getattr(strategy_result, "description", ""),
            }
            self._data["map"] = map_data
            self._data["step"] = step_count
            self._data["claude_calls"] = claude_calls
            self._data["mode"] = mode

    def snapshot(self) -> dict:
        """Retorna una copia del estado actual."""
        with self._lock:
            return json.loads(json.dumps(self._data, default=str))

    def add_command_result(self, result: dict):
        """Agrega un resultado de comando para enviar via WebSocket."""
        with self._lock:
            self._command_results.append(result)

    def pop_command_results(self) -> list[dict]:
        """Retorna y limpia los resultados de comandos pendientes."""
        with self._lock:
            results = self._command_results[:]
            self._command_results.clear()
            return results


class CommandQueue:
    """Cola thread-safe para comandos remotos. Max 10 items."""

    def __init__(self, maxsize: int = 10):
        self._lock = threading.Lock()
        self._queue: list[dict] = []
        self._maxsize = maxsize

    def push(self, command: dict):
        with self._lock:
            if len(self._queue) >= self._maxsize:
                self._queue.pop(0)  # Descartar el mas viejo
            self._queue.append(command)

    def pop(self) -> dict | None:
        with self._lock:
            return self._queue.pop(0) if self._queue else None

    def clear(self):
        with self._lock:
            self._queue.clear()

    def size(self) -> int:
        with self._lock:
            return len(self._queue)


# ---- WebSocket server usando asyncio ----

_ws_clients: set = set()


async def _ws_handler(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    """Maneja una conexion WebSocket raw (handshake + frames)."""
    # Este es un approach simplificado. Para produccion usar websockets library.
    pass


async def _broadcast_loop(shared_state: SharedState, interval_steps: int = 10):
    """Loop que broadcastea estado a clientes WebSocket."""
    try:
        import websockets
        import websockets.server
    except ImportError:
        print("[api_server] websockets library no disponible, WebSocket deshabilitado")
        return

    async def handler(websocket):
        _ws_clients.add(websocket)
        try:
            async for _ in websocket:
                pass  # Solo recibimos para mantener viva la conexion
        finally:
            _ws_clients.discard(websocket)

    server = await websockets.server.serve(handler, "0.0.0.0", API_PORT + 1, ping_interval=20)
    print(f"[api_server] WebSocket escuchando en ws://0.0.0.0:{API_PORT + 1}/")

    last_step = -1
    while True:
        await asyncio.sleep(0.1)  # ~100ms polling
        state = shared_state.snapshot()
        current_step = state.get("step", 0)

        if current_step > last_step and (current_step - last_step) >= interval_steps:
            last_step = current_step
            msg = json.dumps({"type": "state", "data": state, "timestamp": time.time()})

            # Broadcast state
            dead = set()
            for ws in _ws_clients.copy():
                try:
                    await ws.send(msg)
                except Exception:
                    dead.add(ws)
            _ws_clients -= dead

        # Broadcast command results
        results = shared_state.pop_command_results()
        for result in results:
            msg = json.dumps({"type": "command_result", "data": result})
            dead = set()
            for ws in _ws_clients.copy():
                try:
                    await ws.send(msg)
                except Exception:
                    dead.add(ws)
            _ws_clients -= dead


# ---- HTTP server para REST API ----

def _make_http_handler(shared_state: SharedState, command_queue: CommandQueue):
    """Crea un handler HTTP con acceso al estado y la cola de comandos."""

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, format, *args):
            pass  # Silenciar logs HTTP

        def _cors_headers(self):
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")

        def do_OPTIONS(self):
            self.send_response(200)
            self._cors_headers()
            self.end_headers()

        def do_GET(self):
            if self.path == "/health":
                state = shared_state.snapshot()
                body = json.dumps({"status": "ok", "step": state.get("step", 0)})
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self._cors_headers()
                self.end_headers()
                self.wfile.write(body.encode())

            elif self.path == "/api/state":
                state = shared_state.snapshot()
                body = json.dumps(state)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self._cors_headers()
                self.end_headers()
                self.wfile.write(body.encode())

            else:
                self.send_response(404)
                self.end_headers()

        def do_POST(self):
            if self.path == "/api/command":
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length)

                try:
                    cmd = json.loads(body)
                except (json.JSONDecodeError, ValueError):
                    self._respond(400, {"status": "error", "message": "JSON invalido"})
                    return

                fn = cmd.get("fn")
                if fn not in COMMAND_WHITELIST:
                    self._respond(400, {"status": "error", "message": f"Funcion '{fn}' no permitida"})
                    return

                # Verificar modo para comandos de motor
                state = shared_state.snapshot()
                if fn not in ("set_mode", "frenar") and state.get("mode") == "autonomous":
                    self._respond(200, {"status": "ignored", "reason": "autonomous mode"})
                    return

                command_queue.push(cmd)
                self._respond(200, {"status": "queued", "queue_size": command_queue.size()})

            else:
                self.send_response(404)
                self.end_headers()

        def _respond(self, code: int, data: dict):
            body = json.dumps(data)
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self._cors_headers()
            self.end_headers()
            self.wfile.write(body.encode())

    return Handler


def _run_http_server(shared_state: SharedState, command_queue: CommandQueue):
    """Corre el servidor HTTP en el puerto API_PORT."""
    handler = _make_http_handler(shared_state, command_queue)
    server = HTTPServer(("0.0.0.0", API_PORT), handler)
    print(f"[api_server] HTTP escuchando en http://0.0.0.0:{API_PORT}/")
    server.serve_forever()


def _run_ws_server(shared_state: SharedState):
    """Corre el servidor WebSocket en un event loop asyncio."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(_broadcast_loop(shared_state))


def start_server(shared_state: SharedState, command_queue: CommandQueue):
    """Arranca los servidores HTTP y WebSocket en daemon threads."""
    # HTTP server
    http_thread = threading.Thread(
        target=_run_http_server,
        args=(shared_state, command_queue),
        daemon=True,
        name="bouchard-http",
    )
    http_thread.start()

    # WebSocket server
    ws_thread = threading.Thread(
        target=_run_ws_server,
        args=(shared_state,),
        daemon=True,
        name="bouchard-ws",
    )
    ws_thread.start()

    return http_thread, ws_thread
