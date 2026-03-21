# PRD-09: Goal Management

**Phase:** 3 | **Status:** Draft | **Esfuerzo:** M (Medium)
**Fecha:** 2026-03-21

---

## Problema

El robot no tiene concepto de objetivos. Reacciona a la situacion inmediata (via Claude o fallback). No hay tracking de "estoy tratando de llegar al area X" ni "termine de explorar el corredor Y". Sin goals, Claude no puede construir sobre decisiones previas ni planificar secuencias multi-paso.

## User Stories

- Como strategy layer, quiero mantener una cola de goals para que Claude pueda setear planes de exploracion multi-paso.
- Como sistema, quiero detectar cuando un goal se completo o es inalcanzable para que el robot no se atasque persiguiendo targets imposibles.
- Como Claude, quiero saber el estado de mis goals anteriores para ajustar mi estrategia.

## Requisitos

### Must Have

- [ ] FR-1: Crear `goal_manager.py` con tipos de goal: `ExploreArea(x, y, radius)`, `MapCorridor(start, end)`, `ReturnToBase(x, y)`, `InvestigateAnomaly(x, y)`
- [ ] FR-2: Cada goal tiene estados: `PENDING`, `ACTIVE`, `COMPLETED`, `FAILED`, `TIMEOUT`
- [ ] FR-3: Deteccion de completitud: `ExploreArea` completa cuando >80% de celdas dentro del radio estan clasificadas; `MapCorridor` completa cuando el path entre start y end es conocido
- [ ] FR-4: Deteccion de fallo: goal TIMEOUT despues de N steps sin progreso; goal FAILED si el path esta completamente bloqueado
- [ ] FR-5: Cola de goals con prioridad: Claude puede agregar goals, el sistema puede agregar goals (e.g., "re-explorar area donde el mapa es viejo")
- [ ] FR-6: Reportar estado de goals a Claude en la siguiente llamada: "Goal 'explore (1.0, 0.5) r=0.3' COMPLETED -- 87% cobertura alcanzada"

### Nice to Have

- [ ] FR-7: Goals compuestos (secuencia de sub-goals)
- [ ] FR-8: Prioridad dinamica (goal urgente desplaza goal actual)
- [ ] FR-9: Historial de goals completados para evitar repeticion

## Criterios de Aceptacion

- [ ] AC-1: Un goal `ExploreArea` dirige al robot hacia el target y marca COMPLETED cuando se alcanza el umbral de cobertura
- [ ] AC-2: Un goal atascado por 200 steps sin progreso transiciona a FAILED
- [ ] AC-3: Claude recibe estado de goals en su input y puede emitir nuevos goals basados en resultados
- [ ] AC-4: La cola de goals maneja al menos 5 goals simultaneos sin conflicto

## Dependencias

- **Requiere:** PRD-06 (mapa para deteccion de completitud), PRD-07 (strategy layer gestiona goals), PRD-08 (Claude outputea goals)
- **Habilita:** PRD-10 (feedback incluye resultados de goals)

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `controllers/terrain_robot/goal_manager.py` | **Nuevo**: clase GoalManager con cola, estados, deteccion |
| `controllers/terrain_robot/strategy_layer.py` | Integrar cola de goals |
| `controllers/terrain_robot/prompts.py` | Incluir estado de goals en input de Claude |

## Metricas de Exito

- Tasa de completitud de goals >60% para ExploreArea en la arena actual
- Tiempo promedio de deteccion de goal FAILED: <200 steps
- Claude referencia goals anteriores en sus decisiones

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Umbrales de completitud necesitan tuning | Alta | Medio | Empezar con umbrales generosos, ajustar con testing |
| Goals conflictivos (explorar norte y sur simultaneamente) | Baja | Bajo | Solo 1 goal ACTIVE a la vez, resto en PENDING |
| Goal tracking agrega overhead al step | Baja | Bajo | Check de estado cada 10 steps, no cada step |

## Maquina de Estados

```
PENDING ──> ACTIVE ──> COMPLETED
                  ├──> FAILED
                  └──> TIMEOUT

Transiciones:
  PENDING -> ACTIVE:    cuando es el proximo en la cola
  ACTIVE -> COMPLETED:  cuando criterio de completitud se cumple
  ACTIVE -> FAILED:     cuando path completamente bloqueado
  ACTIVE -> TIMEOUT:    cuando no hay progreso por N steps
```

## Estimacion

**M (Medium)** - Nuevo modulo, logica de state machine, integracion con strategy layer. ~4-5 horas.
