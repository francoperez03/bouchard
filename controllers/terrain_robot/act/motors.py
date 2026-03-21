import math


class MotorManager:
    MAX_SPEED = 6.28  # e-puck v1 max rad/s
    AXLE_LENGTH = 0.052  # distancia entre ruedas (m)
    WHEEL_RADIUS = 0.02  # radio de rueda (m)

    def __init__(self, robot, timestep):
        self.left = robot.getDevice("left wheel motor")
        self.right = robot.getDevice("right wheel motor")
        self.left_ps = robot.getDevice("left wheel sensor")
        self.right_ps = robot.getDevice("right wheel sensor")
        self.left_ps.enable(timestep)
        self.right_ps.enable(timestep)

        # Modo rotación continua
        self.left.setPosition(float("inf"))
        self.right.setPosition(float("inf"))
        self.frenar()
        self._vel_izq = 0
        self._vel_der = 0

        # Estado de giro
        self._girando = False
        self._giro_target_left = 0
        self._giro_target_right = 0

    def avanzar(self, velocidad=50):
        """velocidad: 0-100 -> mapeado a 0-MAX_SPEED"""
        self._girando = False
        speed = (min(max(velocidad, 0), 100) / 100) * self.MAX_SPEED
        self.left.setVelocity(speed)
        self.right.setVelocity(speed)
        self._vel_izq = speed
        self._vel_der = speed

    def retroceder(self, velocidad=30):
        """Marcha atrás. velocidad: 0-100 -> mapeado a 0-MAX_SPEED negativo"""
        self._girando = False
        speed = (min(max(velocidad, 0), 100) / 100) * self.MAX_SPEED
        self.left.setVelocity(-speed)
        self.right.setVelocity(-speed)
        self._vel_izq = speed
        self._vel_der = speed

    def girar(self, grados=90, velocidad=30):
        """Gira N grados. positivo=derecha, negativo=izquierda.
        Calcula la rotación de rueda necesaria usando la geometría del e-puck."""
        # Arco que cada rueda debe recorrer
        arco = abs(grados) * (math.pi / 180) * (self.AXLE_LENGTH / 2)
        wheel_rad = arco / self.WHEEL_RADIUS

        # Leer posición actual de encoders
        left_pos = self.left_ps.getValue()
        right_pos = self.right_ps.getValue()

        speed = (min(max(velocidad, 0), 100) / 100) * self.MAX_SPEED

        if grados > 0:  # derecha: izq avanza, der retrocede
            self._giro_target_left = left_pos + wheel_rad
            self._giro_target_right = right_pos - wheel_rad
            self.left.setVelocity(speed)
            self.right.setVelocity(-speed)
        else:  # izquierda: der avanza, izq retrocede
            self._giro_target_left = left_pos - wheel_rad
            self._giro_target_right = right_pos + wheel_rad
            self.left.setVelocity(-speed)
            self.right.setVelocity(speed)

        self._vel_izq = speed
        self._vel_der = speed
        self._girando = True

    def girar_completo(self):
        """Retorna True si el giro en curso ya terminó."""
        if not self._girando:
            return True

        left_pos = self.left_ps.getValue()
        right_pos = self.right_ps.getValue()

        left_ok = abs(left_pos - self._giro_target_left) < 0.05
        right_ok = abs(right_pos - self._giro_target_right) < 0.05

        if left_ok and right_ok:
            self.frenar()
            self._girando = False
            return True
        return False

    @property
    def girando(self):
        return self._girando

    def frenar(self):
        self.left.setVelocity(0)
        self.right.setVelocity(0)
        self._vel_izq = 0
        self._vel_der = 0
        self._girando = False

    def set_velocidad(self, izq=50, der=50):
        """Control independiente por motor, 0-100"""
        self._girando = False
        l = (min(max(izq, 0), 100) / 100) * self.MAX_SPEED
        r = (min(max(der, 0), 100) / 100) * self.MAX_SPEED
        self.left.setVelocity(l)
        self.right.setVelocity(r)
        self._vel_izq = l
        self._vel_der = r

    def get_velocidad_comandada(self):
        """Retorna velocidad promedio comandada (rad/s)"""
        return (self._vel_izq + self._vel_der) / 2
