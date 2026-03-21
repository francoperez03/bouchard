import json
import urllib.request
import urllib.error
from prompts import SYSTEM_PROMPT
from config import CLAUDE_API_KEY
from cache import ResponseCache

_cache = ResponseCache(ttl_steps=500)

STRATEGY_TOOLS = [
    {
        "name": "set_exploration_target",
        "description": "Dirigir robot a coordenadas para explorar esa zona.",
        "input_schema": {
            "type": "object",
            "properties": {
                "x": {
                    "type": "number",
                    "description": "Coordenada X destino en metros",
                },
                "y": {
                    "type": "number",
                    "description": "Coordenada Y destino en metros",
                },
                "reason": {
                    "type": "string",
                    "description": "Razon de la eleccion",
                },
            },
            "required": ["x", "y"],
        },
    },
    {
        "name": "backtrack",
        "description": "Retroceder a la ultima posicion segura conocida.",
        "input_schema": {
            "type": "object",
            "properties": {
                "reason": {
                    "type": "string",
                    "description": "Razon del backtrack",
                }
            },
        },
    },
    {
        "name": "patrol_area",
        "description": "Patrullar sistematicamente un area rectangular.",
        "input_schema": {
            "type": "object",
            "properties": {
                "x1": {
                    "type": "number",
                    "description": "Esquina 1 X",
                },
                "y1": {
                    "type": "number",
                    "description": "Esquina 1 Y",
                },
                "x2": {
                    "type": "number",
                    "description": "Esquina 2 X",
                },
                "y2": {
                    "type": "number",
                    "description": "Esquina 2 Y",
                },
            },
            "required": ["x1", "y1", "x2", "y2"],
        },
    },
    {
        "name": "investigate",
        "description": "Acercarse a un punto de interes para mapearlo mejor.",
        "input_schema": {
            "type": "object",
            "properties": {
                "x": {
                    "type": "number",
                    "description": "Coordenada X",
                },
                "y": {
                    "type": "number",
                    "description": "Coordenada Y",
                },
                "reason": {
                    "type": "string",
                    "description": "Que investigar",
                },
            },
            "required": ["x", "y"],
        },
    },
]


def _parse_claude_response(content):
    """Parsea la respuesta de Claude, limpiando markdown si es necesario.
    Fallback para respuestas text-only (rate-limited/degraded)."""
    content = content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    return json.loads(content)


def _compact_data(sensor_data):
    """Extrae solo los campos esenciales para reducir tokens."""
    ps = sensor_data.get("proximidad", {})
    return {
        "ps": {k: v for k, v in ps.items() if v > 10},
        "terreno": sensor_data.get("terreno_detectado", ""),
        "slip": sensor_data.get("slip_ratio", 0),
        "incl": sensor_data.get("inclinacion", 0),
        "front": sensor_data.get("front_min", 0),
        "side": sensor_data.get("side_min", 0),
        "vib": sensor_data.get("vibracion", 0),
    }


def get_cache():
    """Retorna la instancia del cache para stats externas."""
    return _cache


def ask_claude(sensor_data, history=None, current_step=0, map_data=None, feedback=None):
    """Envia contexto estrategico a Claude API con tool_use y retorna el plan.
    Usa cache para evitar llamadas repetidas con mismo estado cuantizado."""
    compact = _compact_data(sensor_data)

    # Check cache first
    cached = _cache.get(compact, current_step)
    if cached is not None:
        print(f"[claude_client] Cache HIT (step {current_step})")
        return cached

    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
    }

    # Build strategic context message
    pose = sensor_data.get("pose", {})
    user_content = {
        "pose": pose,
        "terreno": sensor_data.get("terreno_detectado", ""),
        "slip": sensor_data.get("slip_ratio", 0),
    }
    if map_data:
        user_content["map"] = map_data
    if feedback:
        user_content["feedback"] = feedback

    user_msg = json.dumps(user_content)

    body = json.dumps({
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 300,
        "system": SYSTEM_PROMPT,
        "tools": STRATEGY_TOOLS,
        "messages": [{"role": "user", "content": user_msg}],
    }).encode()

    print(f"[claude_client] Request ({len(body)}b): {user_msg[:200]}")

    req = urllib.request.Request(url, data=body, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = resp.read().decode()
            result = json.loads(raw)
            usage = result.get("usage", {})

            estrategia = ""
            acciones = []
            for block in result["content"]:
                if block["type"] == "text":
                    estrategia = block["text"]
                elif block["type"] == "tool_use":
                    acciones.append({"fn": block["name"], "args": block["input"]})

            if acciones:
                summary = ", ".join(a["fn"] for a in acciones)
                print(
                    f"[claude_client] OK tool_use "
                    f"({usage.get('input_tokens', '?')}in/"
                    f"{usage.get('output_tokens', '?')}out): "
                    f"{summary}"
                )
                # Strategy tools return goals, not motor commands
                plan = {"goal": acciones[0], "estrategia": estrategia}
                _cache.put(compact, plan, current_step)
                return plan

            # Fallback: text-only response (rate-limited or no tools used)
            print(
                f"[claude_client] OK text fallback "
                f"({usage.get('input_tokens', '?')}in/"
                f"{usage.get('output_tokens', '?')}out): "
                f"{estrategia[:200]}"
            )
            plan = _parse_claude_response(estrategia)
            if plan:
                _cache.put(compact, plan, current_step)
            return plan

    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"[claude_client] HTTP {e.code}: {error_body}")
        return None
    except json.JSONDecodeError as e:
        print(f"[claude_client] JSON malformado: {e}")
        return None
    except Exception as e:
        print(f"[claude_client] Error: {e}")
        return None
