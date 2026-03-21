import math


class SensorManager:
    def __init__(self, robot, timestep):
        self._timestep_s = timestep / 1000.0

        # 8 sensores IR de proximidad
        self.ps = []
        for i in range(8):
            s = robot.getDevice(f"ps{i}")
            s.enable(timestep)
            self.ps.append(s)

        # Acelerómetro
        self.accel = robot.getDevice("accelerometer")
        self.accel.enable(timestep)

        # Giroscopio
        self.gyro = robot.getDevice("gyro")
        self.gyro.enable(timestep)

        # Position sensors (odometría)
        self.left_ps = robot.getDevice("left wheel sensor")
        self.right_ps = robot.getDevice("right wheel sensor")
        self.left_ps.enable(timestep)
        self.right_ps.enable(timestep)

        # Estado previo para cálculos
        self._prev_accel = [0, 0, 0]
        self._prev_left_pos = 0
        self._prev_right_pos = 0

    def _detectar_terreno(self, vibracion, avance_real, accel_z):
        """Clasifica el terreno basándose en sensores."""
        if abs(accel_z) < 9.0:
            return "ramp"
        if vibracion > 0.5:
            return "rough"
        if vibracion < 0.1 and abs(avance_real) < 0.01:
            return "sand"
        if vibracion < 0.1 and abs(avance_real) > 0.05:
            return "carpet"
        return "metal"

    def _calcular_slip(self, avance_real, vel_comandada):
        """Calcula ratio de patinaje. 0=sin slip, 1=slip total."""
        if vel_comandada < 0.01:
            return 0.0
        esperado = vel_comandada * self._timestep_s
        if esperado <= 0:
            return 0.0
        return round(max(0, min(1, 1.0 - (abs(avance_real) / esperado))), 3)

    def _estimar_inclinacion(self, accel):
        """Estima ángulo de inclinación en grados desde el acelerómetro."""
        mag = (accel[0] ** 2 + accel[1] ** 2 + accel[2] ** 2) ** 0.5
        if mag < 0.01:
            return 0.0
        cos_angle = min(1, max(-1, abs(accel[2]) / mag))
        return round(math.degrees(math.acos(cos_angle)), 1)

    def read_all(self, vel_comandada=0):
        """Lee todos los sensores y retorna dict unificado con datos derivados."""
        accel = self.accel.getValues()
        gyro = self.gyro.getValues()

        # Vibración = magnitud del cambio en acelerómetro
        vibracion = sum((a - p) ** 2 for a, p in zip(accel, self._prev_accel)) ** 0.5
        self._prev_accel = list(accel)

        # Odometría
        left_pos = self.left_ps.getValue()
        right_pos = self.right_ps.getValue()
        delta_left = left_pos - self._prev_left_pos
        delta_right = right_pos - self._prev_right_pos
        self._prev_left_pos = left_pos
        self._prev_right_pos = right_pos
        avance_real = (delta_left + delta_right) / 2

        # Proximidad
        prox = {f"ps{i}": round(self.ps[i].getValue(), 1) for i in range(8)}

        # Datos derivados
        terreno = self._detectar_terreno(vibracion, avance_real, accel[2])
        slip = self._calcular_slip(avance_real, vel_comandada)
        inclinacion = self._estimar_inclinacion(accel)
        front_min = min(prox["ps0"], prox["ps7"])
        side_min = min(prox["ps1"], prox["ps6"])

        return {
            "proximidad": prox,
            "accel": {
                "x": round(accel[0], 3),
                "y": round(accel[1], 3),
                "z": round(accel[2], 3),
            },
            "gyro": {
                "x": round(gyro[0], 3),
                "y": round(gyro[1], 3),
                "z": round(gyro[2], 3),
            },
            "vibracion": round(vibracion, 3),
            "avance_real": round(avance_real, 4),
            "odometria": {
                "izq": round(left_pos, 3),
                "der": round(right_pos, 3),
            },
            "terreno_detectado": terreno,
            "slip_ratio": slip,
            "inclinacion": inclinacion,
            "front_min": round(front_min, 1),
            "side_min": round(side_min, 1),
        }
