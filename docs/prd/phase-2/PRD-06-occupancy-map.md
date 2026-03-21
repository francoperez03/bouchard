# PRD-06: Occupancy Map

**Phase:** 2 | **Status:** Draft | **Esfuerzo:** L (Large)
**Fecha:** 2026-03-21

---

## Problema

El robot no tiene memoria de su entorno. Cada lectura de sensor se consume y olvida (excepto las ultimas 3 en `history`). Claude recibe un snapshot del estado actual pero no tiene contexto espacial -- no puede decir "volve al corredor que pasaste hace 30 segundos" porque no sabe que ese corredor existio.

Esta es la pieza clave que diferencia al producto champion: **sin mapa, Claude no puede planificar estrategicamente**.

## User Stories

- Como robot, quiero mantener un mapa 2D grid de celdas exploradas/libres/ocupadas para poder evitar revisitar areas y encontrar fronteras de exploracion.
- Como Claude, quiero recibir un mapa parcial para poder planificar rutas a regiones sin explorar en vez de dar consejos puramente locales.
- Como desarrollador, quiero ver el mapa construido para debuggear la navegacion.

## Requisitos

### Must Have

- [ ] FR-1: Crear `occupancy_map.py` con grid de resolucion configurable (default 5cm por celda para arena 3x3m = grid 60x60)
- [ ] FR-2: Estados de celda: `UNKNOWN` (default), `FREE`, `OCCUPIED`, mas almacenar tipo de terreno junto a ocupacion
- [ ] FR-3: Actualizar mapa desde pose + sensores de proximidad: marcar celdas delante del robot como FREE (si sensor no detecta obstaculo) o OCCUPIED (si sensor devuelve valor alto), usando modelo de rayo simple
- [ ] FR-4: Los 8 sensores IR mapean a 8 direcciones angulares relativas al heading del robot; usar pose.theta para proyectar a coordenadas mundo
- [ ] FR-5: Proveer `get_compact_map()` que retorne representacion comprimida para Claude (e.g., lista de celdas ocupadas + celdas frontera)
- [ ] FR-6: Proveer `get_exploration_stats()`: % celdas exploradas, numero de celdas frontera (FREE adyacente a UNKNOWN)
- [ ] FR-7: Helper de visualizacion: ASCII dump del mapa para debugging (metodo `__str__`)

### Nice to Have

- [ ] FR-8: Decaimiento temporal: celdas viejas gradualmente vuelven a UNKNOWN (el mundo podria cambiar)
- [ ] FR-9: Guardar/cargar mapa a archivo para persistencia entre sesiones
- [ ] FR-10: Heatmap de frecuencia de visita (detectar areas que el robot sobre-visita)

## Criterios de Aceptacion

- [ ] AC-1: Despues de 5 minutos de exploracion en la arena 3x3m, mapa muestra >40% de celdas clasificadas (no UNKNOWN)
- [ ] AC-2: Limites de paredes aparecen como lineas OCCUPIED en el mapa
- [ ] AC-3: Zonas de terreno corresponden aproximadamente a sus posiciones reales en cuadrantes
- [ ] AC-4: Representacion compacta del mapa cabe en <500 tokens para Claude
- [ ] AC-5: `get_exploration_stats()` retorna metricas coherentes

## Dependencias

- **Requiere:** PRD-05 (pose tracking -- no se puede ubicar observaciones en mapa sin saber donde esta el robot)
- **Habilita:** PRD-08 (enviar mapa a Claude), PRD-09 (goal = visitar area sin explorar), PRD-12 (arenas mas grandes), PRD-13/14 (metrica de exploracion %)

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `controllers/terrain_robot/occupancy_map.py` | **Nuevo**: clase OccupancyMap con grid, update, compress, stats |
| `controllers/terrain_robot/terrain_robot.py` | Instanciar mapa, actualizar cada step |
| `controllers/terrain_robot/sensors.py` | Puede necesitar exportar angulos raw de sensores |

## Metricas de Exito

- Precision del mapa >70% comparado con ground truth del layout de la arena
- Mapa compacto <500 tokens
- Overhead de CPU del mapa: <5% del tiempo de step

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Sensores IR tienen rango limitado (~7cm efectivo en e-puck) | Alta | Medio | Esperado -- muchas celdas UNKNOWN lejos del path. Esto es lo que hace valiosa la planificacion |
| Drift de odometria corrompe el mapa | Media | Alto | Usar pose conservadoramente; celdas near-robot son confiables, lejanas menos |
| Mapa compacto excede 500 tokens en arenas grandes | Baja (3x3m) | Alto (15x15m) | Compresion agresiva: solo fronteras + obstaculos, no grid completo |

## Modelo de Ray Casting (Referencia)

```
Para cada sensor IR (i = 0..7):
  angulo_sensor = SENSOR_ANGLES[i]  # relativo al robot
  angulo_mundo = pose.theta + angulo_sensor
  distancia = valor_sensor_normalizado

  Si distancia < UMBRAL_DETECCION:
    # Sensor detecta obstaculo
    obstaculo_x = pose.x + distancia * cos(angulo_mundo)
    obstaculo_y = pose.y + distancia * sin(angulo_mundo)
    marcar_celda(obstaculo_x, obstaculo_y, OCCUPIED)
    # Celdas entre robot y obstaculo son FREE
    marcar_rayo(pose.x, pose.y, obstaculo_x, obstaculo_y, FREE)
  Sino:
    # Sin obstaculo en rango -- marcar rayo como FREE
    end_x = pose.x + MAX_RANGE * cos(angulo_mundo)
    end_y = pose.y + MAX_RANGE * sin(angulo_mundo)
    marcar_rayo(pose.x, pose.y, end_x, end_y, FREE)
```

## Representacion Compacta para Claude

```json
{
  "map_size": [60, 60],
  "explored_pct": 42,
  "frontiers": [[12, 30], [45, 15], [8, 50]],
  "obstacles": [[20, 20], [20, 21], [35, 40]],
  "terrains": {"sand": [[0,0,30,30]], "metal": [[30,0,60,30]]},
  "robot_pos": [25, 35]
}
```

## Estimacion

**L (Large)** - Nuevo modulo con geometria, ray casting, compresion, testing contra ground truth de Webots. ~6-8 horas.
