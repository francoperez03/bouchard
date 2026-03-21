"""
Robot Auto-Programable con Claude API
--------------------------------------
Controller principal para e-puck en Webots.
Lee sensores → envía a Claude API → ejecuta el plan de navegación.
Si Claude no está disponible, usa fallback con obstacle avoidance básico.
"""
from controller import Robot
from sensors import SensorManager
from motors import MotorManager
from safety import SafetyCheck
from fallback import fallback_behavior
from executor import execute_plan
from logger import DataLogger

# Intentar importar Claude client
try:
    from claude_client import ask_claude
    from config import CLAUDE_API_KEY
    CLAUDE_AVAILABLE = CLAUDE_API_KEY and not CLAUDE_API_KEY.startswith("sk-ant-api03-TU")
except Exception:
    CLAUDE_AVAILABLE = False

robot = Robot()
timestep = int(robot.getBasicTimeStep())

sensors = SensorManager(robot, timestep)
motors = MotorManager(robot, timestep)
safety = SafetyCheck(motors)
logger = DataLogger()

# Consultar a Claude cada N pasos (si disponible)
STEPS_PER_CLAUDE_CALL = 100  # ~3 seg entre calls
STEPS_PER_FALLBACK = 5
MAX_CLAUDE_CALLS = 200  # límite por sesión para no fundir créditos

history = []
MAX_HISTORY = 3

step_count = 0
claude_calls = 0
last_action = ""
last_terreno = ""

if CLAUDE_AVAILABLE:
    print(f"[terrain_robot] Modo: CLAUDE API (max {MAX_CLAUDE_CALLS} calls)")
else:
    print("[terrain_robot] Modo: FALLBACK (sin API key)")
    print("[terrain_robot] Editá config.py con tu API key para usar Claude")

print("[terrain_robot] Esperando estabilización de sensores...")

for _ in range(10):
    robot.step(timestep)

print("[terrain_robot] Robot listo. Comenzando loop principal.")


def _necesita_claude(data, last_terreno):
    """Solo llamar a Claude si hay un cambio significativo."""
    terreno = data.get("terreno_detectado", "")
    if terreno != last_terreno:
        return True
    if data.get("slip_ratio", 0) > 0.3:
        return True
    if data.get("front_min", 999) < 120:
        return True
    if data.get("inclinacion", 0) > 8:
        return True
    return False


try:
    while robot.step(timestep) != -1:
        # Si hay un giro en curso, esperar a que termine
        if motors.girando:
            motors.girar_completo()
            continue

        vel_comandada = motors.get_velocidad_comandada()
        data = sensors.read_all(vel_comandada)

        # Safety SIEMPRE corre
        status = safety.check(data)
        if status == "obstacle_front":
            # Recovery: retroceder y girar hacia el lado con más espacio
            ps = data["proximidad"]
            left_free = ps.get("ps5", 0) + ps.get("ps6", 0)
            right_free = ps.get("ps1", 0) + ps.get("ps2", 0)
            giro = -90 if left_free < right_free else 90
            print(f"[recovery] obstacle_front → retroceder + girar {giro}°")
            motors.retroceder(30)
            for _ in range(15):
                robot.step(timestep)
            motors.girar(giro)
            logger.log(data, safety_status=status, action=f"recovery:{giro}")
            step_count = 0
            continue
        elif status != "ok":
            print(f"[safety] {status} - robot frenado")
            logger.log(data, safety_status=status, action="safety_stop")
            step_count = 0
            continue

        step_count += 1

        use_claude = (
            CLAUDE_AVAILABLE
            and claude_calls < MAX_CLAUDE_CALLS
            and step_count % STEPS_PER_CLAUDE_CALL == 0
            and _necesita_claude(data, last_terreno)
        )

        if use_claude:
            # --- MODO CLAUDE ---
            history.append(data)
            if len(history) > MAX_HISTORY:
                history.pop(0)

            try:
                claude_calls += 1
                print(f"\n[claude] Call #{claude_calls}/{MAX_CLAUDE_CALLS}")
                print(f"[claude] Terreno: {data.get('terreno_detectado', '?')} | "
                      f"Slip: {data.get('slip_ratio', 0)} | "
                      f"Inclinación: {data.get('inclinacion', 0)}°")

                plan = ask_claude(data, history if len(history) > 1 else None)

                if plan:
                    print(f"[claude] Terreno: {plan.get('terreno', '?')}")
                    print(f"[claude] Estrategia: {plan.get('estrategia', '?')}")
                    execute_plan(plan, motors)
                    last_action = f"claude:{plan.get('terreno', '?')}"
                    last_terreno = data.get("terreno_detectado", "")
                else:
                    last_action = fallback_behavior(data, motors)
                    print(f"[fallback] Claude retornó None — {last_action}")

            except Exception as e:
                print(f"[claude] Error: {e} — usando fallback")
                last_action = fallback_behavior(data, motors)
                print(f"[fallback] {last_action}")

        elif step_count % STEPS_PER_FALLBACK == 0:
            # --- MODO FALLBACK ---
            last_action = fallback_behavior(data, motors)
            if step_count % (STEPS_PER_FALLBACK * 10) == 0:
                print(f"[fallback] {last_action} | terreno={data.get('terreno_detectado', '?')} "
                      f"slip={data.get('slip_ratio', 0)}")

        # Log cada ciclo
        logger.log(data, safety_status=status, action=last_action)

except KeyboardInterrupt:
    pass
finally:
    logger.close()
    motors.frenar()
    print(f"[terrain_robot] Controller finalizado. Claude calls: {claude_calls}")
