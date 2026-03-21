# PRD-08: Enhanced System Prompt

**Phase:** 2 | **Status:** Draft | **Esfuerzo:** M (Medium)
**Fecha:** 2026-03-21

---

## Problema

`prompts.py` le dice a Claude que actue como controlador reactivo ("mira los sensores, outputea comandos de motor"). Esto desperdicia la capacidad de razonamiento de Claude en decisiones que el codigo maneja mejor (PRD-04). Con pose y mapa disponibles (PRD-05, PRD-06), Claude deberia actuar como **estratega**: "Dado este mapa parcial con fronteras en [(1.2, 0.5), (-0.8, -1.0)], que area deberia explorar el robot?"

**Este PRD es el punto de convergencia de Phase 2** -- donde todo se une.

## User Stories

- Como Claude, quiero recibir un mapa y pose para tomar decisiones genuinamente estrategicas (a donde explorar, cuando retroceder, como abordar un dead end).
- Como sistema, quiero que Claude outputee goals de alto nivel (coordenadas target, estrategia de exploracion) en vez de comandos motores de bajo nivel.

## Requisitos

### Must Have

- [ ] FR-1: Nuevo system prompt que describe el rol de Claude como estratega, no controlador de motores
- [ ] FR-2: Input a Claude incluye: pose actual, mapa compacto, lista de fronteras, % exploracion, resumen de eventos recientes
- [ ] FR-3: Output de Claude cambia de `{"acciones": [...]}` a `{"goal": {"type": "explore|backtrack|investigate|patrol", "target": [x, y]}, "reasoning": "...", "priority": "high|medium|low"}`
- [ ] FR-4: Si usa tool_use (PRD-02), definir herramientas estrategicas: `set_exploration_target(x, y)`, `backtrack()`, `patrol_area(x1, y1, x2, y2)`, `investigate_obstacle(direction)`
- [ ] FR-5: Reducir frecuencia de llamadas a Claude de cada 100 steps a cada 300-500 steps (decisiones estrategicas necesitan actualizaciones menos frecuentes)
- [ ] FR-6: Mantener una "estrategia actual" que persiste hasta que Claude la actualice o se complete/invalide

### Nice to Have

- [ ] FR-7: Claude puede pedir mas informacion antes de decidir ("necesito mas datos del sector norte")
- [ ] FR-8: Multiple goals con prioridad (goal principal + goals secundarios)

## Criterios de Aceptacion

- [ ] AC-1: Respuestas de Claude referencian features del mapa ("area sin explorar al noreste", "corredor entre obstaculos en (0.3, -0.5)")
- [ ] AC-2: Robot explora mas sistematicamente que wandering random (medido por % exploracion over time)
- [ ] AC-3: Token usage por call aumenta levemente (datos del mapa) pero frecuencia disminuye, costo neto neutral o menor
- [ ] AC-4: Goal outputeado por Claude es una coordenada valida dentro de los bounds del mapa

## Dependencias

- **Requiere:** PRD-02 (tool_use para output estructurado), PRD-05 (pose), PRD-06 (mapa), PRD-07 (strategy layer recibe goals)
- **Habilita:** PRD-09 (goal management), PRD-10 (feedback loop)

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `controllers/terrain_robot/prompts.py` | Rewrite completo del system prompt |
| `controllers/terrain_robot/claude_client.py` | Nuevo data packaging con mapa + pose |
| `controllers/terrain_robot/strategy_layer.py` | Consumir nuevo formato de respuesta |
| `controllers/terrain_robot/executor.py` | Posiblemente reemplazado por strategy_layer goal handling |

## Metricas de Exito

- Cobertura de exploracion a 5 min: actual ~25% (random) -> target >50% (estrategica)
- Costo por sesion: igual o menor pese a input mas rico
- Calidad de decisions: Claude sugiere goals que avanzan exploracion

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Mapa compacto excede context window en arenas grandes | Baja (3x3m) | Alto | Compresion agresiva: solo fronteras, no grid completo |
| Claude alucina coordenadas que no existen en el mapa | Media | Medio | Validar targets contra bounds del mapa antes de ejecutar |
| Prompt engineering requiere muchas iteraciones | Alta | Bajo | Iterar con logs de sesiones reales |
| Cambio de formato rompe compatibilidad | Baja | Medio | Mantener fallback a formato anterior |

## System Prompt Propuesto (Borrador)

```
Sos el navegador estrategico de un robot explorador (e-puck).

TU ROL: Decidir A DONDE ir, no COMO moverte. Los reflejos del robot
manejan obstaculos y velocidad automaticamente.

RECIBES:
- pose: posicion actual (x, y, theta) en metros
- mapa: grid con celdas exploradas, obstaculos, y fronteras
- fronteras: coordenadas de celdas FREE adyacentes a UNKNOWN (donde explorar)
- stats: % explorado, distancia recorrida, colisiones
- feedback: resultado del ultimo plan (si hubo)

RESPONDES con UN goal estrategico:
- explore(x, y): dirigirse a una frontera para expandir el mapa
- backtrack(): retroceder al ultimo punto conocido seguro
- investigate(x, y): acercarse a un obstaculo o anomalia
- patrol(x1, y1, x2, y2): cubrir un area sistematicamente

CRITERIOS DE DECISION:
- Priorizar fronteras grandes (mas celdas UNKNOWN adyacentes)
- Evitar re-explorar areas ya mapeadas
- Si un goal fallo antes, elegir ruta alternativa
- Si % explorado > 90%, reportar mision completada
```

## Estimacion

**M (Medium)** - Prompt engineering + data packaging + response parsing. ~4-6 horas.
