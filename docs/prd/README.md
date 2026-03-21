# Bouchard - Product Requirements Documents

> Robot autonomo con IA estrategica para navegacion de terrenos variados.
> Nombre en honor a Hipolito Bouchard, corsario argentino que navegaba con estrategia en terreno hostil.

## Status

| PRD | Titulo | Phase | Esfuerzo | Status | Dependencias |
|-----|--------|-------|----------|--------|--------------|
| 01 | Config Security | 1 | S | Draft | - |
| 02 | Tool Use Native | 1 | M | Draft | - |
| 03 | Response Cache | 1 | S | Draft | - |
| 04 | Deterministic Rules | 1 | S | Draft | - |
| 05 | Pose Tracking | 2 | M | Draft | 04 |
| 06 | Occupancy Map | 2 | L | Draft | 05 |
| 07 | Reflex/Strategy Split | 2 | M | Draft | 04 |
| 08 | Enhanced Prompt | 2 | M | Draft | 02, 05, 06, 07 |
| 09 | Goal Management | 3 | M | Draft | 06, 07, 08 |
| 10 | Execution Feedback | 3 | M | Draft | 08, 09 |
| 11 | History Compression | 3 | S | Draft | 10 |
| 12 | Complex Arena | 4 | L | Draft | 06 |
| 13 | Benchmark System | 4 | M | Draft | 12 |
| 14 | ~~Metrics Dashboard~~ | 4 | M | Reemplazado | 10, 13 |
| 15 | Landing Page | 5 | S | Draft | - |
| 16 | Real-time Status Dashboard | 5 | L | Draft | 05, 06, 07, 15 |
| 17 | Remote Command Interface | 5 | M | Draft | 07, 15, 16 |

> **Nota:** PRD-14 reemplazado por PRD-16 (solucion web real-time mas completa).

## Arbol de Dependencias

```
Phase 1 (paralelo, sin dependencias entre si):
  PRD-01 Config Security ──────┐
  PRD-02 Tool Use Native ──────┤
  PRD-03 Response Cache ───────┤──> Phase 2
  PRD-04 Deterministic Rules ──┘

Phase 2 (secuencial):
  PRD-05 Pose Tracking ────> PRD-06 Occupancy Map ──┐
  PRD-04 ──> PRD-07 Reflex/Strategy Split ──────────┤──> PRD-08 Enhanced Prompt
  PRD-02 ───────────────────────────────────────────┘

Phase 3 (depende de Phase 2):
  PRD-08 ──> PRD-09 Goal Management ──┐
  PRD-08 ──> PRD-10 Execution Feedback┤──> PRD-11 History Compression
                                      ┘

Phase 4 (depende de Phase 2+3):
  PRD-06 ──> PRD-12 Complex Arena ──> PRD-13 Benchmark System
  PRD-10 ──> PRD-14 Metrics Dashboard <── PRD-13  [REEMPLAZADO por PRD-16]

Phase 5 - Web Interface (depende de Phase 2):
  PRD-15 Landing Page ──> PRD-16 Real-time Status ──> PRD-17 Remote Command
                               ^
  PRD-05, PRD-06, PRD-07 ─────┘
```

## Estimacion Total

| Phase | Descripcion | Esfuerzo | Semanas estimadas |
|-------|-------------|----------|-------------------|
| 1 | Foundation (quick wins) | 4x S/M | 1-2 |
| 2 | Core Architecture | 3x M + 1x L | 2-3 |
| 3 | Intelligence | 2x M + 1x S | 1-2 |
| 4 | Validation | 1x L + 2x M | 2-3 |
| 5 | Web Interface | 1x S + 1x L + 1x M | 3-4 |
| **Total** | | | **~11-12 semanas** |

## Producto Champion

**Arquitectura hibrida**: reflejos locales (codigo, cada step) + planificador estrategico IA (Claude, cuando importa) sobre un mapa de ocupacion que el robot construye en tiempo real.

**Tesis a validar**: Claude navega >30% mejor que heuristicas simples cuando tiene un mapa parcial y arenas complejas.

## Archivos del Proyecto

```
bouchard/
  controllers/terrain_robot/
    terrain_robot.py    # Loop principal
    sensors.py          # 8 IR + accel + gyro + odometria
    motors.py           # Control diferencial
    claude_client.py    # Integracion Claude API
    executor.py         # Ejecuta planes JSON
    fallback.py         # Comportamiento autonomo
    safety.py           # Safety checks
    prompts.py          # System prompt
    logger.py           # Logging CSV
    config.py           # API key config
  worlds/
    terrain_arena.wbt   # Arena 3x3m, 4 terrenos + rampa
  web/                  # Frontend Vite + React (Phase 5)
    src/
      pages/            # HomePage, StatusPage, ControlPage
      components/       # SensorPanel, MapCanvas, CommandPanel, etc.
      contexts/         # ConnectionContext (WebSocket)
      hooks/            # useRobotState, useCommands
      types/            # TypeScript interfaces
  docs/
    prd/                # Este directorio
```
