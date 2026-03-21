"""
Robot Auto-Programable con Claude API
--------------------------------------
Controller principal para e-puck en Webots.
Arquitectura de dos capas: reflex (cada step) + strategy (periodico via Claude).
Servidor API embebido para dashboard web y control remoto.
"""
from controller import Robot
from sensors import SensorManager
from motors import MotorManager
from reflex_layer import ReflexLayer
from strategy_layer import StrategyLayer
from logger import DataLogger
from occupancy_map import OccupancyMap
from executor import execute_plan

# Intentar importar Claude client
try:
    from claude_client import ask_claude, get_cache
    from config import CLAUDE_API_KEY
    CLAUDE_AVAILABLE = bool(CLAUDE_API_KEY and CLAUDE_API_KEY.startswith("sk-ant-"))
except Exception:
    CLAUDE_AVAILABLE = False
    ask_claude = None
    get_cache = None

# Intentar importar API server
try:
    from api_server import SharedState, CommandQueue, start_server
    API_AVAILABLE = True
except Exception as e:
    print(f"[terrain_robot] API server no disponible: {e}")
    API_AVAILABLE = False

robot = Robot()
timestep = int(robot.getBasicTimeStep())

sensors = SensorManager(robot, timestep)
motors = MotorManager(robot, timestep)
reflexes = ReflexLayer()
strategy = StrategyLayer(
    ask_claude_fn=ask_claude,
    claude_available=CLAUDE_AVAILABLE,
    max_calls=200,
    call_interval=300,
)
logger = DataLogger()
occ_map = OccupancyMap()

step_count = 0
mode = "autonomous"  # "autonomous" o "manual"

# Inicializar API server
shared_state = None
command_queue = None
if API_AVAILABLE:
    shared_state = SharedState()
    command_queue = CommandQueue()
    try:
        start_server(shared_state, command_queue)
        print("[terrain_robot] API server iniciado")
    except Exception as e:
        print(f"[terrain_robot] Error iniciando API server: {e}")
        API_AVAILABLE = False

if CLAUDE_AVAILABLE:
    print(f"[terrain_robot] Modo: CLAUDE API (max 200 calls)")
else:
    if not globals().get("CLAUDE_API_KEY"):
        print("[terrain_robot] Modo: FALLBACK (API key no encontrada)")
        print("[terrain_robot] Setea ANTHROPIC_API_KEY como variable de entorno")
    else:
        print("[terrain_robot] Modo: FALLBACK (API key invalida - debe empezar con 'sk-ant-')")

print("[terrain_robot] Esperando estabilizacion de sensores...")
for _ in range(10):
    robot.step(timestep)
print("[terrain_robot] Robot listo. Comenzando loop principal.")

try:
    while robot.step(timestep) != -1:
        if motors.girando:
            motors.girar_completo()
            continue

        data = sensors.read_all(motors.get_velocidad_comandada())
        occ_map.update(data["pose"], data)
        step_count += 1

        # --- Consumir comando remoto ---
        if command_queue:
            cmd = command_queue.pop()
            if cmd:
                fn = cmd.get("fn")
                if fn == "set_mode":
                    mode = cmd.get("args", {}).get("mode", "autonomous")
                    print(f"[terrain_robot] Modo cambiado a: {mode}")
                    if shared_state:
                        shared_state.add_command_result({"fn": fn, "result": "executed"})
                elif fn == "frenar":
                    motors.frenar()
                    if shared_state:
                        shared_state.add_command_result({"fn": fn, "result": "executed"})
                elif mode == "manual":
                    execute_plan([cmd], motors)
                    if shared_state:
                        shared_state.add_command_result({"fn": fn, "result": "executed"})
                else:
                    if shared_state:
                        shared_state.add_command_result({"fn": fn, "result": "ignored", "reason": "autonomous mode"})

        # Capa reflexiva (cada step, ambos modos)
        reflex = reflexes.update(data)

        # Safety override: reflex siempre gana en emergencia
        if reflex.emergency:
            motors.frenar()
            if reflex.heading_override:
                motors.retroceder(reflex.velocity)
                for _ in range(15):
                    robot.step(timestep)
                motors.girar(reflex.heading_override)
            action = reflex.description
            # Notificar override si habia un comando manual
            if command_queue and cmd and mode == "manual" and shared_state:
                shared_state.add_command_result({
                    "fn": cmd.get("fn", ""),
                    "result": "overridden",
                    "reason": reflex.description,
                })
        elif mode == "autonomous":
            # Capa estrategica (solo en autonomo)
            strat = strategy.update(data, step_count, map_data=occ_map.get_compact_map())
            if strat.has_action:
                if strat.target_heading is not None and abs(strat.target_heading) > 5:
                    motors.girar(int(strat.target_heading))
                elif strat.target_speed is not None:
                    motors.avanzar(strat.target_speed)
                action = strat.description
            elif reflex.heading_override:
                motors.girar(reflex.heading_override)
                action = reflex.description
            else:
                motors.avanzar(reflex.velocity)
                action = reflex.description
        else:
            # Modo manual: no hacer nada extra (comando ya ejecutado arriba)
            if not reflex.heading_override:
                action = f"manual: {cmd['fn']}" if (command_queue and cmd) else "manual: idle"
            else:
                # Reflex no-emergency heading override aplica tambien en manual
                motors.girar(reflex.heading_override)
                action = reflex.description

        # Crear strat dummy para logging si estamos en manual
        if mode != "autonomous":
            strat = type("StratResult", (), {
                "has_action": False, "target_heading": None,
                "target_speed": None, "description": f"manual mode"
            })()

        # Actualizar estado compartido para API
        if shared_state:
            shared_state.update(
                sensor_data=data,
                reflex_result=reflex,
                strategy_result=strat,
                map_data=occ_map.get_compact_map(),
                step_count=step_count,
                claude_calls=strategy.claude_calls,
                mode=mode,
            )

        logger.log(data, safety_status="ok", action=action)

        # Record to session history (every 10 steps)
        if step_count % 10 == 0:
            strategy.record_step(data, action)

except KeyboardInterrupt:
    pass
finally:
    logger.close()
    motors.frenar()
    stats = occ_map.get_exploration_stats()
    print(f"[terrain_robot] Mapa: {stats['explored_pct']}% explorado, "
          f"{stats['frontiers']} fronteras, {stats['occupied']} obstáculos")
    strategy.print_goal_stats()
    strategy.print_feedback_stats()
    if get_cache:
        get_cache().print_stats()
    print(f"[terrain_robot] Controller finalizado. Claude calls: {strategy.claude_calls}")
