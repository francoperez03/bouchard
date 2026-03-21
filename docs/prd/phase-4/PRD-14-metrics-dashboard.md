# PRD-14: Metrics Dashboard

**Phase:** 4 | **Status:** Draft | **Esfuerzo:** M (Medium)
**Fecha:** 2026-03-21

---

## Problema

`logger.py` escribe datos CSV raw pero no hay visualizacion ni analisis. Un desarrollador debe abrir el CSV manualmente y calcular metricas. No hay forma de observar la performance del robot en tiempo real ni comparar entre sesiones.

## User Stories

- Como desarrollador, quiero un dashboard mostrando exploracion %, colisiones, costo API, y tasa de exito de planes mientras el robot corre.
- Como desarrollador, quiero comparar metricas entre sesiones y estrategias.
- Como presentador, quiero graficos listos para mostrar resultados del proyecto.

## Requisitos

### Must Have

- [ ] FR-1: Crear `scripts/dashboard.py` que lee el log CSV (o live-tail) y muestra metricas clave
- [ ] FR-2: Metricas:
  - Exploracion % (del mapa)
  - Conteo de colisiones (eventos safety)
  - Conteo de deadlocks (sin progreso >50 steps)
  - API calls usadas + costo estimado
  - Tasa de exito de planes
  - Distancia recorrida
  - Distribucion de tiempo por terreno
- [ ] FR-3: Visualizacion con matplotlib/plotly:
  - Exploracion over time (line chart)
  - Trayectoria del robot (x, y scatter plot)
  - Heatmap de sensores
- [ ] FR-4: Estadisticas de resumen: mean, max, min para metricas clave
- [ ] FR-5: Comparacion multi-sesion: cargar multiples CSVs y superponer graficos
- [ ] FR-6: Exportar resumen como markdown para inclusion en reportes de benchmark

### Nice to Have

- [ ] FR-7: Dashboard web interactivo (Plotly Dash o similar)
- [ ] FR-8: Modo near-real-time que actualiza mientras el robot corre
- [ ] FR-9: Animacion de la trayectoria sobre el layout del mapa

## Criterios de Aceptacion

- [ ] AC-1: Dashboard renderiza desde un log CSV en <5 segundos
- [ ] AC-2: Grafico de exploracion-over-time muestra claramente la diferencia entre estrategias
- [ ] AC-3: Dashboard funciona tanto post-hoc (desde CSV guardado) como near-real-time (tailing log activo)
- [ ] AC-4: Trayectoria x,y plotteada coincide con el movimiento observado en Webots

## Dependencias

- **Requiere:** PRD-05 (pose para trayectoria), PRD-06 (exploracion %), PRD-10 (tasa de exito de planes), PRD-13 (datos de benchmark para visualizar)
- **Habilita:** Comunicacion de resultados, presentaciones, publicacion

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `scripts/dashboard.py` | **Nuevo**: visualizacion y analisis de datos |
| `controllers/terrain_robot/logger.py` | Posibles columnas adicionales para nuevas metricas |
| `requirements.txt` | **Nuevo**: matplotlib (o plotly) como dependencia |

## Metricas de Exito

- Dashboard provee analisis completo de sesion en una vista
- Usado como herramienta primaria durante analisis de benchmark
- Graficos son lo suficientemente claros para presentaciones

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Dependencia de matplotlib/plotly agrega complejidad de instalacion | Baja | Bajo | Dashboard es opcional (no requerido para operacion del robot), documentar instalacion |
| CSV muy grande (sesiones largas) es lento de procesar | Baja | Bajo | Sampling o procesamiento incremental |
| Formato de CSV cambia entre PRDs | Media | Medio | Definir schema de CSV estable en PRD-05/06 y mantener backward compat |

## Ejemplo de Output

```
=== Bouchard Session Report ===
Arena: complex_seed42 (15x15m)
Strategy: Claude (strategic)
Duration: 10 min (18,750 steps)

Exploration: 68.3% [====████████████░░░░░░]
Collisions:  3
Deadlocks:   1
Distance:    45.2m
API calls:   35 ($0.014)
Plan success: 78% (25/32)

[Chart: Exploration % over time]
[Chart: Robot trajectory on map]
[Chart: Terrain time distribution]
```

## Estimacion

**M (Medium)** - Codigo de visualizacion, procesamiento de datos, charting. ~4-5 horas.
