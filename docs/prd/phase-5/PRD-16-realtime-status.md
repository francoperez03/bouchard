# PRD-16: Real-time Status Dashboard

**Phase:** 5 | **Status:** Draft | **Esfuerzo:** L (Large)
**Fecha:** 2026-03-21

---

## Problema

El robot ejecuta su loop principal en `terrain_robot.py` (linea 57: `while robot.step(timestep) != -1`) produciendo datos ricos cada step: 8 sensores IR (`sensors.read_all()` retorna dict con 15+ keys), pose `{x, y, theta}`, terreno detectado, slip ratio, estado de reflejos (`ReflexResult` con emergency/velocity/heading_override/description), estado estrategico (`StrategyResult` con has_action/target_heading/target_speed/description), mapa de ocupacion (`occ_map.get_compact_map()` con explored_pct/frontiers/obstacles), y conteo de Claude calls (`strategy.claude_calls`).

Toda esta informacion se pierde en la consola de Webots o se archiva en CSV (`logger.py`, 26 columnas). No hay forma de observar el estado del robot en tiempo real desde fuera del proceso de Webots. PRD-14 propuso un dashboard matplotlib post-hoc, pero no cubre la necesidad de monitoreo live ni la visualizacion del mapa de ocupacion en tiempo real.

Se necesita: (1) un servidor API embebido en el controller que publique el estado via WebSocket, y (2) un frontend React que lo consuma y visualice — sensores en tiempo real, pose en un canvas, mapa de ocupacion renderizado, estado de las capas reflex/strategy, y metricas acumuladas.

**Nota:** Este PRD reemplaza y supera a PRD-14 (Metrics Dashboard). La solucion web real-time cubre todas las metricas de PRD-14 mas monitoreo live.

## User Stories

- Como desarrollador, quiero ver los 8 sensores IR, pose, terreno y slip del robot actualizandose en tiempo real en mi navegador para diagnosticar comportamiento sin depender de prints en consola.
- Como robot (sistema), quiero publicar mi estado interno via WebSocket sin impactar el timing del loop principal de 32ms para que el monitoreo no degrade la simulacion.
- Como investigador, quiero ver el mapa de ocupacion construyendose en tiempo real sobre un canvas para validar visualmente que el ray-casting esta funcionando correctamente.
- Como presentador, quiero un dashboard visual profesional mostrando todas las metricas del robot para demos en vivo del proyecto.

## Requisitos

### Must Have

- [ ] **FR-1**: Crear `controllers/terrain_robot/api_server.py` con servidor FastAPI corriendo en un thread secundario (`threading.Thread(daemon=True)`). Endpoints: `GET /health`, `WS /ws` (WebSocket de estado). El servidor escucha en `0.0.0.0:8765` por default (puerto configurable via env var `BOUCHARD_API_PORT`)
- [ ] **FR-2**: Clase `SharedState` thread-safe (usa `threading.Lock`) en `api_server.py` que el main loop escribe y el WebSocket lee. Contiene:
  - `sensor_data`: dict completo de `sensors.read_all()`
  - `reflex_result`: description + emergency + velocity
  - `strategy_result`: description + has_action + target_heading + target_speed
  - `map_data`: dict de `occ_map.get_compact_map()`
  - `step_count`: int
  - `claude_calls`: int
  - `mode`: string ("autonomous" / "manual")
- [ ] **FR-3**: En `terrain_robot.py`, despues de cada step, actualizar `SharedState` con los datos actuales. El write debe ser non-blocking (< 1ms) para no afectar el loop de 32ms
- [ ] **FR-4**: El WebSocket endpoint envia estado JSON al cliente cada N steps (default: cada 10 steps, ~320ms, configurable). Formato:
  ```json
  {
    "type": "state",
    "data": {
      "sensors": {...},
      "reflex": {...},
      "strategy": {...},
      "map": {...},
      "step": 1234,
      "claude_calls": 15,
      "mode": "autonomous"
    },
    "timestamp": 1234567890.123
  }
  ```
- [ ] **FR-5**: Componente React `SensorPanel` en `web/src/components/SensorPanel.tsx`: muestra los 8 sensores IR como barras radiales alrededor de un icono de robot (vista top-down). Colores: verde (< 100, warning threshold), amarillo (100-150), rojo (> 150, danger threshold). Umbrales desde `SAFETY_THRESHOLDS` en `terrain_rules.py`
- [ ] **FR-6**: Componente React `PoseDisplay` en `web/src/components/PoseDisplay.tsx`: muestra x, y, theta numericamente + un mini-canvas con el trail de posiciones recientes (ultimos 200 puntos)
- [ ] **FR-7**: Componente React `MapCanvas` en `web/src/components/MapCanvas.tsx`: renderiza el mapa de ocupacion usando HTML5 Canvas. Colores:
  - Gris: UNKNOWN
  - Blanco: FREE
  - Negro: OCCUPIED
  - Overlay: posicion del robot como triangulo orientado, fronteras como puntos azules
  - Terrenos como colores tenues (arena=amarillo, metal=gris, carpet=marron, rough=rojo, ramp=verde)
- [ ] **FR-8**: Componente React `LayerStatus` en `web/src/components/LayerStatus.tsx`: muestra estado de reflex layer (description, emergency flag, velocity) y strategy layer (description, goal activo, claude calls usadas/max). Indicador visual: reflex emergency = fondo rojo parpadeante
- [ ] **FR-9**: Componente React `MetricsBar` en `web/src/components/MetricsBar.tsx`: barra horizontal con: step count, exploration %, claude calls (N/200), terreno actual, slip ratio. Actualizacion en tiempo real
- [ ] **FR-10**: Hook `useRobotState` en `web/src/hooks/useRobotState.ts` que consume el WebSocket via `ConnectionContext` (PRD-15) y parsea mensajes de tipo "state" en objetos tipados

### Nice to Have

- [ ] **FR-11**: Renderizar mapa con Pixi.js en vez de Canvas 2D para mejor performance en arenas grandes (PRD-12: 150x150 grid)
- [ ] **FR-12**: Grafico de exploracion % over time (ultimos 1000 steps) usando una libreria de charting lightweight (e.g., uPlot)
- [ ] **FR-13**: Panel de log scrollable mostrando los ultimos 50 mensajes de la consola del robot
- [ ] **FR-14**: Exportar snapshot del estado actual como JSON descargable
- [ ] **FR-15**: Endpoint REST `GET /api/state` como alternativa al WebSocket para integraciones simples

## Criterios de Aceptacion

- [ ] **AC-1**: El servidor API arranca junto con el robot y responde a `GET /health` con `{"status": "ok", "step": N}` en < 100ms
- [ ] **AC-2**: El WebSocket transmite estado al frontend con latencia < 500ms medida end-to-end (timestamp del step hasta rendering en browser)
- [ ] **AC-3**: El loop principal en `terrain_robot.py` mantiene su timing de 32ms con el servidor activo (overhead del write a SharedState < 1ms medido con `time.perf_counter()`)
- [ ] **AC-4**: El mapa de ocupacion renderizado en Canvas muestra obstaculos y areas libres que coinciden con lo observable en la vista 3D de Webots
- [ ] **AC-5**: El dashboard muestra datos correctos para los 8 sensores IR (validado cruzando con prints de consola existentes)
- [ ] **AC-6**: Con el WebSocket desconectado (frontend cerrado), el robot sigue operando normalmente sin memory leaks ni errores

## Dependencias

- **Requiere:** PRD-05 (pose tracking para display de posicion), PRD-06 (occupancy map para visualizacion), PRD-07 (reflex/strategy split para display de estado de capas), PRD-15 (shell React para montar los componentes)
- **Habilita:** PRD-17 (el API server creado aqui se extiende con endpoints de comando)
- **Reemplaza:** PRD-14 (metrics dashboard matplotlib — esta solucion web es mas completa y real-time)

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `controllers/terrain_robot/api_server.py` | **Nuevo**: FastAPI server, SharedState, WebSocket endpoint, health check |
| `controllers/terrain_robot/terrain_robot.py` | Modificar: importar api_server, crear SharedState, arrancar thread del servidor, actualizar estado cada step (~lineas 30, 40, 65, 94) |
| `controllers/terrain_robot/requirements.txt` | **Nuevo o modificar**: agregar `fastapi`, `uvicorn[standard]`, `websockets` |
| `web/src/pages/StatusPage.tsx` | Reemplazar placeholder con dashboard real |
| `web/src/components/SensorPanel.tsx` | **Nuevo**: visualizacion radial de sensores IR |
| `web/src/components/PoseDisplay.tsx` | **Nuevo**: display numerico + trail de pose |
| `web/src/components/MapCanvas.tsx` | **Nuevo**: canvas de mapa de ocupacion |
| `web/src/components/LayerStatus.tsx` | **Nuevo**: estado de capas reflex/strategy |
| `web/src/components/MetricsBar.tsx` | **Nuevo**: barra de metricas resumen |
| `web/src/hooks/useRobotState.ts` | **Nuevo**: hook que consume WebSocket y parsea estado |
| `web/src/types/robot.ts` | **Nuevo**: tipos TypeScript para SensorData, Pose, MapData, ReflexState, StrategyState |

## Metricas de Exito

| Metrica | Target |
|---------|--------|
| Latencia WebSocket (step -> browser render) | < 500ms |
| Overhead del SharedState write en main loop | < 1ms por step |
| Frame rate del Canvas del mapa | > 30 FPS |
| Uso de memoria del api_server thread | < 50MB |
| Tiempo de primer render del dashboard tras conexion | < 1 segundo |

## Riesgos

| Riesgo | Prob | Impacto | Mitigacion |
|--------|------|---------|------------|
| Thread del servidor compite por GIL con el main loop de Webots | Media | Alto | FastAPI/uvicorn corren en thread con su propio event loop asyncio; SharedState usa Lock con timeout minimo. El main loop solo hace un write atomico por step |
| Webots no permite threads adicionales en el controller | Baja | Critico | Testear temprano. Alternativa: lanzar servidor como subprocess con IPC via pipe o shared memory |
| Canvas rendering lento para arenas 150x150 (PRD-12) | Media | Medio | Canvas 2D es suficiente para 60x60 (arena actual). Para 150x150, usar `OffscreenCanvas` o migrar a Pixi.js (FR-11) |
| WebSocket broadcast a multiples clientes causa backpressure | Baja | Bajo | Limitar a 5 conexiones simultaneas; enviar cada 10 steps (no cada step) |
| Dependencia de FastAPI en el controller Python | Baja | Medio | FastAPI es lightweight; instalar en el Python de Webots. Si no es posible, fallback a `http.server` + `websockets` de la stdlib |

## Arquitectura del Servidor

```
terrain_robot.py (main thread)         api_server.py (daemon thread)
         |                                      |
   robot.step(32ms)                     uvicorn + FastAPI
         |                                      |
   sensors.read_all() -> data            WS /ws endpoint
   reflexes.update(data) -> reflex       GET /health
   strategy.update(data) -> strat        (PRD-17: POST /api/command)
   occ_map.update(data)                        |
         |                                      |
   shared_state.update(                  cada 320ms (10 steps):
     data, reflex, strat,                 json = shared_state.snapshot()
     occ_map, step_count                  broadcast(json) to WS clients
   )  # < 1ms, lock                            |
         |                              Browser (React)
   motors.execute(...)                   useRobotState() hook
   logger.log(...)                       renders components
```

## Estimacion

**L (Large)** — Servidor embebido con threading + WebSocket, 5 componentes React con Canvas rendering, tipado TypeScript, integracion con main loop. ~10-12 horas.
