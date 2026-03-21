# PRD-13: Benchmark System

**Phase:** 4 | **Status:** Draft | **Esfuerzo:** M (Medium)
**Fecha:** 2026-03-21

---

## Problema

No hay forma objetiva de comparar la exploracion guiada por Claude vs. el fallback autonomo vs. random walk. Sin benchmarks, el proyecto no puede probar su tesis central: **que la planificacion estrategica con IA mejora la navegacion robotica**.

Este es el PRD que valida todo el trabajo anterior.

## User Stories

- Como desarrollador, quiero un script de benchmark que corra la misma arena con diferentes estrategias y produzca un reporte comparativo.
- Como stakeholder, quiero evidencia cuantitativa de que Claude agrega valor mas alla del costo.
- Como investigador, quiero resultados reproducibles para publicacion.

## Requisitos

### Must Have

- [ ] FR-1: Crear `scripts/benchmark.py` que corra el controlador del robot en Webots con estrategia configurable: `claude`, `fallback`, `random`
- [ ] FR-2: Cada run dura una duracion fija (e.g., 10 minutos / 18,750 steps a 32ms timestep)
- [ ] FR-3: Recolectar metricas por run:
  - Exploracion % (celdas clasificadas / total)
  - Colisiones (eventos de safety)
  - Deadlocks (atascado por >50 steps)
  - Eficiencia de path (distancia / area cubierta)
  - Costo API (calls * costo promedio)
  - Tiempo total de wall-clock
- [ ] FR-4: Correr cada estrategia N veces (default 3) en cada variante de arena para significancia estadistica
- [ ] FR-5: Output tabla comparativa (markdown) + datos raw (CSV)
- [ ] FR-6: Estrategia "random": comandos de motor puramente aleatorios como baseline minimo

### Nice to Have

- [ ] FR-7: Modo headless de Webots para runs mas rapidos
- [ ] FR-8: Graficos automaticos (exploracion over time por estrategia)
- [ ] FR-9: Statistical significance tests (t-test entre estrategias)

## Criterios de Aceptacion

- [ ] AC-1: Benchmark completa 3 estrategias x 3 runs x 1 arena en <2 horas (Webots headless)
- [ ] AC-2: Output incluye tabla markdown comparando todas las estrategias en todas las metricas
- [ ] AC-3: Resultados son reproducibles (mismo seed, misma arena = mismo resultado para estrategias deterministicas)
- [ ] AC-4: Claude strategy logra >1.5x cobertura de exploracion comparado con fallback en arenas complejas

## Dependencias

- **Requiere:** PRD-12 (arena compleja para comparacion significativa), PRD-06 (% exploracion requiere mapa)
- **Habilita:** Validacion cientifica de la tesis del proyecto

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `scripts/benchmark.py` | **Nuevo**: orchestrador de benchmark |
| `scripts/benchmark_results/` | **Nuevo**: directorio para outputs |
| `controllers/terrain_robot/terrain_robot.py` | Posible flag de linea de comandos para seleccion de estrategia |

## Metricas de Exito

- Claude strategy >1.5x exploracion vs fallback en arenas complejas
- Costo por % explorado es razonable (<$0.002 por 1% en arena compleja)
- Resultados reproducibles entre runs

## Output Esperado

```markdown
## Benchmark Results - Arena: complex_seed42 (15x15m)

| Metric            | Claude  | Fallback | Random  |
|-------------------|---------|----------|---------|
| Exploration %     | 68.3%   | 41.2%    | 18.7%   |
| Collisions        | 3       | 8        | 47      |
| Deadlocks         | 1       | 4        | 12      |
| Distance (m)      | 45.2    | 52.1     | 38.9    |
| Path efficiency   | 0.015   | 0.008    | 0.005   |
| API calls         | 35      | 0        | 0       |
| API cost          | $0.014  | $0.00    | $0.00   |
| Wall time (min)   | 10.0    | 10.0     | 10.0    |

Winner: Claude (+65.5% vs Fallback, +265% vs Random)
Cost per 1% explored: $0.0002
```

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Webots headless no soportado en todas las plataformas | Media | Alto | Testear modo headless temprano; fallback a --minimize |
| Runs toman demasiado tiempo | Media | Medio | Paralelizar si es posible; reducir duracion de run |
| Claude no supera al fallback | Media | Critico | Esto seria un resultado valido (pivot decision). Documentar y analizar por que |

## Estimacion

**M (Medium)** - Scripting, automatizacion de Webots, recoleccion de datos. ~5-6 horas.
