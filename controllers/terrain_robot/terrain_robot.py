"""
Robot Auto-Programable con Claude API
--------------------------------------
Controller principal para e-puck en Webots.
Arquitectura de dos capas: reflex (cada step) + strategy (periodico via Claude).
"""
from controller import Robot
from sensors import SensorManager
from motors import MotorManager
from reflex_layer import ReflexLayer
from strategy_layer import StrategyLayer
from logger import DataLogger
from occupancy_map import OccupancyMap

# Intentar importar Claude client
try:
    from claude_client import ask_claude, get_cache
    from config import CLAUDE_API_KEY
    CLAUDE_AVAILABLE = bool(CLAUDE_API_KEY and CLAUDE_API_KEY.startswith("sk-ant-"))
except Exception:
    CLAUDE_AVAILABLE = False
    ask_claude = None
    get_cache = None

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

        # Capa reflexiva (cada step)
        reflex = reflexes.update(data)

        # Capa estrategica (periodica)
        strat = strategy.update(data, step_count, map_data=occ_map.get_compact_map())

        # Ejecutar: reflexes siempre ganan en emergencia
        if reflex.emergency:
            motors.frenar()
            if reflex.heading_override:
                motors.retroceder(reflex.velocity)
                for _ in range(15):
                    robot.step(timestep)
                motors.girar(reflex.heading_override)
            action = reflex.description
        elif strat.has_action:
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

        logger.log(data, safety_status="ok", action=action)

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
