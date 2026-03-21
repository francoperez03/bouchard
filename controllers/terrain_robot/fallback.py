"""
Comportamiento fallback cuando Claude API no está disponible.
Obstacle avoidance básico + exploración simple.
"""

import random


VELOCIDADES = {"metal": 60, "carpet": 50, "sand": 35, "rough": 25, "ramp": 30}


def fallback_behavior(data, motors):
    """Navegación autónoma básica sin Claude, con adaptación a terreno."""
    ps = data["proximidad"]

    # Valores frontales
    front_right = ps.get("ps0", 0)
    front_left = ps.get("ps7", 0)
    right = ps.get("ps1", 0) + ps.get("ps2", 0)
    left = ps.get("ps5", 0) + ps.get("ps6", 0)

    # Obstáculo frontal: retroceder primero para ganar espacio
    if front_right > 100 or front_left > 100:
        motors.retroceder(30)
        if left < right:
            motors.girar(-45)
        else:
            motors.girar(45)
        return "esquivando obstáculo"

    # Obstáculo lateral derecho
    if right > 200:
        motors.set_velocidad(60, 40)
        return "esquivando derecha"

    # Obstáculo lateral izquierdo
    if left > 200:
        motors.set_velocidad(40, 60)
        return "esquivando izquierda"

    # Velocidad según terreno detectado
    terreno = data.get("terreno_detectado", "metal")
    velocidad = VELOCIDADES.get(terreno, 40)

    # Reducir si hay patinaje
    slip = data.get("slip_ratio", 0)
    if slip > 0.3:
        velocidad = max(20, velocidad - 15)

    # Reducir en rampa/inclinación
    inclinacion = data.get("inclinacion", 0)
    if inclinacion > 10:
        velocidad = max(20, velocidad - 10)

    # Giro aleatorio ocasional para explorar
    if random.random() < 0.05:
        giro = random.choice([-30, -15, 15, 30])
        motors.girar(giro)
        return f"explorando ({terreno})"

    motors.avanzar(velocidad)
    return f"avanzando en {terreno} a {velocidad}% slip={slip}"
