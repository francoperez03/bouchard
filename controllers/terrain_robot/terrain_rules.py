"""
Fuente única de verdad para constantes del robot y reglas de terreno.
Importado por: fallback.py, safety.py, prompts.py, y futuros módulos.
"""

# Velocidades base por tipo de terreno (0-100)
TERRAIN_SPEEDS = {
    "metal": 60,
    "carpet": 50,
    "sand": 35,
    "rough": 25,
    "ramp": 30,
}

# Umbrales de seguridad
SAFETY_THRESHOLDS = {
    "prox_danger": 150,
    "prox_warning": 100,
    "tilt_accel_z_min": 7.0,
    "slip_max": 0.3,
    "incline_max": 10,
    "warmup_cycles": 50,
}

# Geometría del robot e-puck
ROBOT_GEOMETRY = {
    "wheel_radius": 0.02,      # metros
    "axle_length": 0.052,      # distancia entre ruedas (metros)
    "robot_radius": 0.037,     # radio del cuerpo (metros)
}

# Ángulos de los 8 sensores IR (grados, 0=frente)
SENSOR_ANGLES = {
    "ps0": 10,
    "ps1": 45,
    "ps2": 90,
    "ps3": 150,
    "ps4": 210,
    "ps5": 270,
    "ps6": 315,
    "ps7": 350,
}
