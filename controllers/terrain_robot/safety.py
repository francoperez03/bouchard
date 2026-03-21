class SafetyCheck:
    PROX_DANGER = 150
    TILT_ACCEL_Z_MIN = 7.0
    WARMUP_CYCLES = 50  # ignorar tilt durante estabilización

    def __init__(self, motors):
        self.motors = motors
        self._cycle = 0

    def check(self, data):
        """Revisa datos de sensores y frena si hay peligro.
        Retorna 'ok' o un string describiendo el peligro."""
        self._cycle += 1

        # Obstáculo frontal
        ps = data["proximidad"]
        ps0 = ps.get("ps0", 0)
        ps7 = ps.get("ps7", 0)
        if ps0 > self.PROX_DANGER or ps7 > self.PROX_DANGER:
            self.motors.frenar()
            print(f"[safety] obstacle_front | ps0={ps0:.1f} ps7={ps7:.1f} (umbral={self.PROX_DANGER})")
            return "obstacle_front"

        # Obstáculos laterales: no frenar, dejar que fallback esquive.
        # Safety solo loguea para diagnóstico.

        # Durante warmup, no chequear tilt (sensores inestables)
        if self._cycle < self.WARMUP_CYCLES:
            return "ok"

        # Inclinación peligrosa
        accel_z = abs(data["accel"]["z"])
        if accel_z < self.TILT_ACCEL_Z_MIN:
            self.motors.frenar()
            print(f"[safety] tilt_danger | accel_z={accel_z:.3f} (min={self.TILT_ACCEL_Z_MIN})")
            return "tilt_danger"

        return "ok"
