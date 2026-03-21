# PRD-11: History Compression

**Phase:** 3 | **Status:** Draft | **Esfuerzo:** S (Small)
**Fecha:** 2026-03-21

---

## Problema

El historial actual es una lista raw de las ultimas 3 lecturas de sensores (`terrain_robot.py` linea 37-38, enviado en linea 127). Esto es muy poco contexto (3 snapshots = ~1 segundo de datos) y demasiado crudo (dumps de sensores completos cuando Claude solo necesita tendencias).

A medida que el sistema obtiene datos mas ricos (mapa, goals, feedback), la gestion de contexto se vuelve critica.

## User Stories

- Como Claude, quiero un resumen comprimido de la sesion para poder tomar decisiones estrategicas informadas sin exceder limites de contexto.
- Como sistema, quiero gestionar el uso de context window eficientemente para mantener costos bajos.

## Requisitos

### Must Have

- [ ] FR-1: Reemplazar historial raw con resumen estructurado de sesion: terrenos visitados, obstaculos encontrados, goals completados/fallidos, distancia recorrida, tiempo transcurrido
- [ ] FR-2: Mantener ventana rolling de "eventos notables": cambios de terreno, colisiones, completitud de goals, lecturas inusuales
- [ ] FR-3: Comprimir eventos viejos: ultimos 5 eventos en detalle, 20 anteriores como resumen de una linea, eventos mas viejos como estadisticas
- [ ] FR-4: Budget total de tokens de historial: <300 tokens independientemente de la duracion de la sesion
- [ ] FR-5: Auto-generar texto resumen desde datos estructurados (no almacenar como texto, reconstruir cada call)

### Nice to Have

- [ ] FR-6: Eventos "pinneados" que nunca se comprimen (descubrimientos importantes)
- [ ] FR-7: Resumen adaptativo: mas detalle en la zona actual, menos en zonas lejanas

## Criterios de Aceptacion

- [ ] AC-1: Despues de una sesion de 500 steps, historial enviado a Claude cabe en <300 tokens
- [ ] AC-2: Historial incluye eventos clave de toda la sesion, no solo los ultimos 3 steps
- [ ] AC-3: Claude referencia eventos anteriores en su razonamiento ("el corredor al norte estaba bloqueado antes")

## Dependencias

- **Requiere:** PRD-10 (datos de feedback alimentan historial)
- **Habilita:** Sesiones mas largas con contexto mas rico

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `controllers/terrain_robot/history_manager.py` | **Nuevo**: clase HistoryManager con buffer, compresion, generacion |
| `controllers/terrain_robot/terrain_robot.py` | Reemplazar lista `history` con HistoryManager |
| `controllers/terrain_robot/claude_client.py` | Usar historial comprimido en mensaje |

## Metricas de Exito

- Tokens de contexto para historial: actual ~150 (3 lecturas raw) -> target <300 con 10x mas densidad de informacion
- Claude usa informacion historica en sus decisiones (verificable en logs)

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Compresion pierde detalles criticos | Media | Medio | Buffer de "eventos notables" que nunca se comprimen (colisiones, fallos, descubrimientos) |
| Resumen no es util para Claude | Baja | Bajo | Iterar formato basado en calidad de respuestas de Claude |

## Ejemplo de Historial Comprimido

```json
{
  "session_summary": {
    "steps": 450,
    "distance_m": 3.2,
    "explored_pct": 42,
    "terrains_visited": ["metal", "sand", "carpet"],
    "collisions": 2,
    "goals_completed": 3,
    "goals_failed": 1
  },
  "recent_events": [
    {"step": 445, "type": "goal_completed", "detail": "explore (1.0, 0.5) r=0.3 - 87% covered"},
    {"step": 430, "type": "terrain_change", "detail": "sand -> carpet"},
    {"step": 410, "type": "obstacle_avoided", "detail": "barrel at (0.8, 0.3)"},
    {"step": 380, "type": "goal_failed", "detail": "explore (-0.5, -0.8) - path blocked"},
    {"step": 350, "type": "reflex_override", "detail": "emergency stop, tilt detected"}
  ],
  "older_summary": "Explored metal zone (100%), sand zone partial (60%). Two collisions in sand near barrels."
}
```

## Estimacion

**S (Small)** - Logica de sumarizacion de datos, sin algoritmos complejos. ~2-3 horas.
