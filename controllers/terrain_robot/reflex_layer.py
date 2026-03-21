"""
Capa reflexiva: corre cada step del robot.
Maneja evasion de obstaculos, velocidad por terreno, y compensacion de slip.
"""

import random
from terrain_rules import TERRAIN_SPEEDS, SAFETY_THRESHOLDS


class ReflexResult:
    """Resultado de la evaluacion reflexiva."""
    __slots__ = ("emergency", "velocity", "heading_override", "description")

    def __init__(self, emergency=False, velocity=50, heading_override=None, description=""):
        self.emergency = emergency
        self.velocity = velocity
        self.heading_override = heading_override
        self.description = description


class ReflexLayer:
    def __init__(self):
        self._prox_danger = SAFETY_THRESHOLDS["prox_danger"]
        self._prox_warning = SAFETY_THRESHOLDS["prox_warning"]
        self._tilt_min_z = SAFETY_THRESHOLDS["tilt_accel_z_min"]
        self._slip_max = SAFETY_THRESHOLDS["slip_max"]
        self._incline_max = SAFETY_THRESHOLDS["incline_max"]
        self._warmup = SAFETY_THRESHOLDS["warmup_cycles"]
        self._cycle = 0

    def update(self, data):
        """Evalua sensores y retorna ReflexResult con accion reflexiva.
        Corre cada step. No toca motores directamente."""
        self._cycle += 1
        ps = data["proximidad"]

        ps0 = ps.get("ps0", 0)
        ps7 = ps.get("ps7", 0)
        right = ps.get("ps1", 0) + ps.get("ps2", 0)
        left = ps.get("ps5", 0) + ps.get("ps6", 0)

        # === EMERGENCY: obstacle muy cerca ===
        if ps0 > self._prox_danger or ps7 > self._prox_danger:
            giro = -90 if left < right else 90
            return ReflexResult(
                emergency=True, velocity=30,
                heading_override=giro,
                description=f"emergency: obstacle ps0={ps0:.0f} ps7={ps7:.0f}"
            )

        # === TILT: inclinacion peligrosa (post-warmup) ===
        if self._cycle > self._warmup:
            accel_z = abs(data["accel"]["z"])
            if accel_z < self._tilt_min_z:
                return ReflexResult(
                    emergency=True, velocity=0,
                    description=f"tilt_danger: accel_z={accel_z:.3f}"
                )

        # === WARNING: obstacle frontal ===
        if ps0 > self._prox_warning or ps7 > self._prox_warning:
            giro = -45 if left < right else 45
            return ReflexResult(
                velocity=30, heading_override=giro,
                description="esquivando obstaculo frontal"
            )

        # === Lateral obstacles ===
        if right > 200:
            return ReflexResult(velocity=50, heading_override=-15, description="esquivando derecha")
        if left > 200:
            return ReflexResult(velocity=50, heading_override=15, description="esquivando izquierda")

        # === Terrain-based velocity ===
        terreno = data.get("terreno_detectado", "metal")
        velocidad = TERRAIN_SPEEDS.get(terreno, 40)

        slip = data.get("slip_ratio", 0)
        if slip > self._slip_max:
            velocidad = max(20, velocidad - 15)

        inclinacion = data.get("inclinacion", 0)
        if inclinacion > self._incline_max:
            velocidad = max(20, velocidad - 10)

        # === Random exploration jitter ===
        if random.random() < 0.05:
            giro = random.choice([-30, -15, 15, 30])
            return ReflexResult(velocity=velocidad, heading_override=giro,
                                description=f"explorando ({terreno})")

        return ReflexResult(velocity=velocidad, description=f"avanzando en {terreno}")
