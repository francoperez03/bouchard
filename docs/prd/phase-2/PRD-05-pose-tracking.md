# PRD-05: Pose Tracking

**Phase:** 2 | **Status:** Draft | **Esfuerzo:** M (Medium)
**Fecha:** 2026-03-21

---

## Problema

`sensors.py` computa `delta_left` y `delta_right` desde los encoders de ruedas cada step (lineas 73-79) y `avance_real` (linea 79), pero descarta la posicion acumulada. El robot no tiene concepto de "donde estoy" en la arena. Sin pose (x, y, theta), no se puede construir un mapa de ocupacion (PRD-06).

Los datos de odometria existen pero se usan solo para calcular slip, no para localizar al robot.

## User Stories

- Como robot, quiero trackear mi posicion (x, y, theta) desde odometria para poder construir un mapa de donde estuve.
- Como Claude, quiero conocer la posicion del robot para poder planificar rutas a areas sin explorar.
- Como desarrollador, quiero visualizar la trayectoria del robot para validar la navegacion.

## Requisitos

### Must Have

- [ ] FR-1: Implementar dead-reckoning con cinematica diferencial:
  - `dx = avance * cos(theta)`
  - `dy = avance * sin(theta)`
  - `dtheta = (delta_right - delta_left) / AXLE_LENGTH`
- [ ] FR-2: Usar constantes de `motors.py`: `WHEEL_RADIUS = 0.02`, `AXLE_LENGTH = 0.052` (o centralizar en `terrain_rules.py`)
- [ ] FR-3: Exponer `get_pose() -> (x, y, theta)` desde SensorManager
- [ ] FR-4: Incluir pose en el dict de `read_all()`: `"pose": {"x": float, "y": float, "theta": float}`
- [ ] FR-5: Agregar columnas x, y, theta al CSV de logger

### Nice to Have

- [ ] FR-6: Fusion con giroscopio para correccion de theta (los datos de gyro ya se leen pero no se usan para pose)
- [ ] FR-7: Factor de confianza basado en slip_ratio (si slip > 0.3, reducir peso del update de odometria)
- [ ] FR-8: Reset de pose al inicio de cada sesion con coordenadas del world file

## Criterios de Aceptacion

- [ ] AC-1: Despues de conducir 1m en linea recta, x o y reportado cambia en ~1.0 (dentro de 20% drift)
- [ ] AC-2: Despues de un giro de 360 grados, theta retorna a aproximadamente el valor original (dentro de 15 grados)
- [ ] AC-3: Pose se loguea cada step y la trayectoria coincide visualmente con lo que se ve en Webots
- [ ] AC-4: `read_all()` incluye key "pose" con x, y, theta

## Dependencias

- **Requiere:** PRD-04 (constantes centralizadas, util pero no bloqueante)
- **Habilita:** PRD-06 (mapa de ocupacion necesita pose para ubicar observaciones)

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `controllers/terrain_robot/sensors.py` | Agregar pose tracking en `read_all()`, nuevo metodo `get_pose()`, acumular x/y/theta |
| `controllers/terrain_robot/logger.py` | Agregar columnas x, y, theta al CSV |
| `controllers/terrain_robot/terrain_robot.py` | Pasar pose a datos de Claude si disponible |

## Metricas de Exito

- Error de posicion <30% sobre un trayecto de 3m en la arena actual
- Trayectoria reconstruida desde CSV visualmente correlaciona con el movimiento real en Webots

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Drift de odometria acumula, especialmente en arena (slip) y rampa | Alta | Medio | Usar slip_ratio para reducir confianza del update; fusion con gyro para theta |
| Error crece con el tiempo | Alta | Medio | Aceptable para arena 3x3m; arenas mas grandes (PRD-12) pueden necesitar landmarks |
| Pose inicial no coincide con mundo | Baja | Bajo | Leer posicion inicial del robot en el .wbt o setear (0,0,0) |

## Cinematica Diferencial (Referencia)

```
En cada step:
  delta_left  = (pos_izq_actual - pos_izq_anterior) * WHEEL_RADIUS
  delta_right = (pos_der_actual - pos_der_anterior) * WHEEL_RADIUS
  avance = (delta_left + delta_right) / 2
  dtheta = (delta_right - delta_left) / AXLE_LENGTH

  theta += dtheta
  x += avance * cos(theta)
  y += avance * sin(theta)
```

## Estimacion

**M (Medium)** - Matematica simple pero requiere calibracion contra Webots. ~3-4 horas.
