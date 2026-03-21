# PRD-10: Execution Feedback Loop

**Phase:** 3 | **Status:** Draft | **Esfuerzo:** M (Medium)
**Fecha:** 2026-03-21

---

## Problema

Claude da un plan, el robot lo ejecuta, pero Claude nunca se entera si funciono. Flujo actual: Claude dice "avanzar(50)" -> robot lo hace -> 100 steps despues Claude recibe datos de sensores frescos pero sin reporte de que paso. Claude no puede aprender de sus errores dentro de una sesion.

## User Stories

- Como Claude, quiero saber si mi ultimo plan tuvo exito para poder ajustar mi estrategia.
- Como sistema, quiero trackear resultados de planes para construir un perfil de confiabilidad de diferentes estrategias.
- Como desarrollador, quiero datos de outcomes para analisis offline de la calidad de decisiones de Claude.

## Requisitos

### Must Have

- [ ] FR-1: Despues de ejecutar un plan de Claude, trackear: llego el robot al target? Encontro obstaculos inesperados? Los reflejos preemptaron el plan? Cuantos steps tomo la ejecucion?
- [ ] FR-2: Empaquetar feedback como input estructurado a Claude:
  ```json
  {
    "last_plan": {
      "goal": "explore (1, 0.5)",
      "outcome": "partial",
      "reason": "obstacle at (0.8, 0.3)",
      "steps_taken": 45,
      "progress": 0.6
    }
  }
  ```
- [ ] FR-3: Trackear tasa acumulada de exito de planes durante la sesion
- [ ] FR-4: Si un plan falla 3 veces seguidas para el mismo goal, escalar a Claude con flag "repeated failure"
- [ ] FR-5: Loguear todos los outcomes de planes para analisis offline

### Nice to Have

- [ ] FR-6: Score de confianza por tipo de estrategia (explore funciona 80%, backtrack funciona 95%)
- [ ] FR-7: Claude puede preguntar "que paso?" si el feedback es ambiguo

## Criterios de Aceptacion

- [ ] AC-1: Claude recibe feedback de su plan anterior en cada llamada
- [ ] AC-2: Claude ajusta estrategia cuando recibe reporte de fallo (sugiere ruta alternativa)
- [ ] AC-3: Datos de outcome de planes se loguean en CSV junto a datos de sensores
- [ ] AC-4: Flag "repeated failure" se activa correctamente al tercer fallo consecutivo

## Dependencias

- **Requiere:** PRD-08 (Claude outputea goals que se pueden trackear), PRD-09 (goal manager provee estado de completitud/fallo)
- **Habilita:** PRD-11 (historial incluye outcomes), PRD-14 (tasa de exito como metrica)

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `controllers/terrain_robot/feedback.py` | **Nuevo**: clase FeedbackTracker (o integrado en strategy_layer) |
| `controllers/terrain_robot/claude_client.py` | Incluir feedback en user message |
| `controllers/terrain_robot/logger.py` | Agregar columnas de outcome de plan |
| `controllers/terrain_robot/prompts.py` | Instruir a Claude a usar feedback |

## Metricas de Exito

- Calidad de planes de Claude mejora within-session: tasa de exito en steps 100-200 > tasa en steps 0-100
- Claude referencia feedback en su razonamiento (verificable en logs)

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Demasiados datos de feedback inflan el contexto | Media | Medio | Solo enviar ultimo outcome + stats acumulados, no historial completo |
| Claude ignora el feedback | Media | Bajo | Hacer feedback prominente en el prompt, testear con ejemplos |
| Definir "exito" vs "fallo" es ambiguo | Media | Medio | Criterios claros: llego al target (exito), timeout o bloqueado (fallo), preemptado por reflex (parcial) |

## Estimacion

**M (Medium)** - Data tracking + packaging + iteracion de prompt. ~4-5 horas.
