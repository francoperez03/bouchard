# PRD-03: Response Cache

**Phase:** 1 | **Status:** Draft | **Esfuerzo:** S (Small)
**Fecha:** 2026-03-21

---

## Problema

Claude es llamado cada 100 steps cuando `_necesita_claude()` retorna True (cambio de terreno, slip alto, obstaculo cercano, inclinacion pronunciada). Pero el robot puede encontrar la misma situacion repetidamente (e.g., conduciendo en alfombra sin obstaculos). Cada llamada cuesta ~$0.0004 y 1-3 segundos de latencia. El limite `MAX_CLAUDE_CALLS = 200` existe especificamente por costo.

## User Stories

- Como sistema, quiero cachear respuestas de Claude para estados similares para que situaciones repetidas se manejen al instante y sin costo.
- Como desarrollador, quiero ver la tasa de cache hits para entender cuanta IA es realmente necesaria.

## Requisitos

### Must Have

- [ ] FR-1: Hashear los datos compactos de sensores (output de `_compact_data()`) con valores cuantizados: proximidad redondeada a nearest 50, slip a nearest 0.1, inclinacion a nearest 5 grados
- [ ] FR-2: Almacenar respuestas en un Python dict (in-memory, sin persistencia -- las sesiones son cortas)
- [ ] FR-3: Cache hit salta la llamada API, retorna el plan almacenado directamente
- [ ] FR-4: Cache con TTL de N steps (configurable, default 500) para permitir re-evaluacion
- [ ] FR-5: Loguear tasa de cache hit/miss

### Nice to Have

- [ ] FR-6: Cache warming: pre-popular con respuestas para estados comunes
- [ ] FR-7: Cache stats al final de la sesion (hits, misses, ratio, ahorro estimado)

## Criterios de Aceptacion

- [ ] AC-1: Segundo encuentro de "alfombra, sin obstaculos, sin slip" retorna resultado cacheado en <1ms
- [ ] AC-2: Cache hit rate >30% en una sesion tipica de 200 calls en la arena actual
- [ ] AC-3: API calls totales reducidas al menos 30% para exploracion equivalente
- [ ] AC-4: Costo por sesion baja de $0.08 a <$0.056

## Dependencias

- **Requiere:** Nada
- **Habilita:** Reduccion de costos hace sesiones largas viables para Phase 3 y 4

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `controllers/terrain_robot/claude_client.py` | Agregar capa de cache alrededor de `ask_claude()` |
| `controllers/terrain_robot/cache.py` | **Nuevo**: clase ResponseCache con hash, TTL, stats |

## Metricas de Exito

- API calls por sesion: 200 -> <140
- Costo por sesion: $0.08 -> <$0.056
- Latencia promedio por decision: reducida en 30%+ (cache hits son instantaneos)

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Cuantizacion agresiva mapea estados diferentes al mismo key | Media | Medio | Loguear colisiones de cache keys durante testing |
| Cache demasiado conservador (TTL corto) reduce beneficio | Baja | Bajo | Parametro configurable, empezar con TTL alto |
| Estado cacheado ya no aplica (obstáculo se movio) | Baja | Bajo | TTL asegura re-evaluacion periodica |

## Ejemplo de Cuantizacion

```python
# Estado raw
{"ps0": 87, "ps7": 112, "terreno": "carpet", "slip": 0.23, "incl": 4.7}

# Estado cuantizado (cache key)
{"ps0": 100, "ps7": 100, "terreno": "carpet", "slip": 0.2, "incl": 5}

# Hash: hash(frozenset(cuantizado.items())) -> int
```

## Estimacion

**S (Small)** - 1-2 archivos, hash + dict simple. ~2-3 horas.
