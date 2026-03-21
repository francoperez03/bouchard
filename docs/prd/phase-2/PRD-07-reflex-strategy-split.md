# PRD-07: Reflex vs Strategy Split

**Phase:** 2 | **Status:** Draft | **Esfuerzo:** M (Medium)
**Fecha:** 2026-03-21

---

## Problema

El main loop en `terrain_robot.py` mezcla tres concerns en una cadena if/elif plana:
- Safety checks (lineas 84-103)
- Llamadas estrategicas a Claude (lineas 114-141)
- Fallback reactivo (lineas 144-149)

No hay separacion explicita de capas. El robot no puede simultaneamente ejecutar reflejos Y un plan de Claude -- es uno u otro por step. Esto es la anti-tesis de la arquitectura champion (reflejos siempre + estrategia cuando aplica).

## User Stories

- Como sistema, quiero separacion clara donde reflejos (evasion de obstaculos, velocidad por terreno, compensacion de slip) corren cada step, y Claude provee overlay estrategico (a donde explorar) que los reflejos pueden preemptar.
- Como desarrollador, quiero poder agregar nuevos reflejos sin tocar el codigo de integracion con Claude.

## Requisitos

### Must Have

- [ ] FR-1: Crear `reflex_layer.py` que corre cada step: evasion de obstaculos, velocidad adaptativa por terreno, compensacion de slip (extraido de `fallback.py` + `safety.py`)
- [ ] FR-2: Crear `strategy_layer.py` que gestiona interaccion con Claude: cuando llamar, que datos enviar, como mantener el plan estrategico actual
- [ ] FR-3: Strategy layer setea un "goal actual" (e.g., "dirigirse a coordenada (1.0, 0.5)"); reflex layer traduce goal en comandos motores mientras evita obstaculos
- [ ] FR-4: Reflex layer puede overridear estrategia (e.g., obstaculo detectado overridea "avanzar")
- [ ] FR-5: Main loop se convierte en: `data = sensors.read_all()` -> `reflexes.update(data)` -> `strategy.update(data, map)` -> `motors.execute(reflexes.merge(strategy))`
- [ ] FR-6: Cuando no hay estrategia activa, reflejos default al comportamiento actual del fallback (exploracion random)

### Nice to Have

- [ ] FR-7: Prioridad configurable entre reflex y strategy (slider autonomia)
- [ ] FR-8: Logging separado para decisiones reflex vs strategy

## Criterios de Aceptacion

- [ ] AC-1: Robot evita obstaculos con la misma confiabilidad que el fallback actual, incluso en medio de un plan de Claude
- [ ] AC-2: Cuerpo del main loop es <30 lineas (vs las ~90 actuales)
- [ ] AC-3: Agregar un nuevo reflejo (e.g., "evitar zonas oscuras") requiere cambios en solo `reflex_layer.py`
- [ ] AC-4: Tasa de colisiones sin cambio vs baseline actual

## Dependencias

- **Requiere:** PRD-04 (reglas de terreno centralizadas para que ambas capas las compartan)
- **Habilita:** PRD-08 (strategy layer es lo que habla con Claude), PRD-09 (goal management vive en strategy layer)

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `controllers/terrain_robot/reflex_layer.py` | **Nuevo**: comportamiento reactivo cada-step |
| `controllers/terrain_robot/strategy_layer.py` | **Nuevo**: gestion de Claude + plan estrategico |
| `controllers/terrain_robot/terrain_robot.py` | Reescribir main loop para usar capas |
| `controllers/terrain_robot/fallback.py` | Absorbido en reflex_layer, posiblemente eliminado |
| `controllers/terrain_robot/safety.py` | Absorbido en reflex_layer, posiblemente eliminado |

## Metricas de Exito

- Tasa de colisiones: sin cambio
- Lineas del main loop: ~90 -> <30
- Modularidad: cada nuevo comportamiento toca 1 archivo

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Merging de comandos reflex y strategy es no-trivial | Media | Alto | Reflejos siempre ganan; strategy provee heading/posicion target, reflejos manejan motores con evasion |
| Comportamiento emergente inesperado del merge | Media | Medio | Testing extensivo comparando con baseline |
| Over-engineering de la arquitectura | Baja | Bajo | Mantener simple: reflex override strategy, no negociacion compleja |

## Arquitectura Propuesta

```
Cada step:

  1. sensors.read_all() -> data
  2. map.update(data)

  3. reflex_layer.update(data):
     - Chequear obstaculos frontales -> frenar/girar si peligro
     - Aplicar velocidad por terreno
     - Compensar slip
     - Resultado: {velocidad, heading_override, emergency}

  4. strategy_layer.update(data, map):
     - Si tiene goal activo: calcular heading hacia goal
     - Si necesita Claude: llamar API, obtener nuevo goal
     - Resultado: {target_heading, target_speed, goal_status}

  5. merge:
     Si reflex.emergency: usar reflex (safety first)
     Si reflex.heading_override: usar reflex heading + strategy speed
     Si no: usar strategy heading + reflex speed adjustments

  6. motors.execute(merged_command)
  7. logger.log(data, reflex_decision, strategy_decision)
```

## Estimacion

**M (Medium)** - Reestructuracion significativa pero sin algoritmos nuevos. ~4-6 horas.
