# PRD-02: Tool Use Native

**Phase:** 1 | **Status:** Draft | **Esfuerzo:** M (Medium)
**Fecha:** 2026-03-21

---

## Problema

`claude_client.py` envia datos de sensores como string JSON en un mensaje de usuario y parsea la respuesta de texto libre de Claude con `_parse_claude_response()` (lineas 8-13), que debe hacer strip de markdown fences (`` ```json ... ``` ``). Este approach es fragil: Claude a veces envuelve en backticks, a veces no, y el JSON puede ser invalido.

La API de Anthropic soporta `tool_use` nativo que garantiza output JSON estructurado con schema validado.

## User Stories

- Como sistema, quiero que Claude devuelva tool calls estructurados para eliminar errores de parsing de JSON.
- Como desarrollador, quiero que el schema de acciones este definido una sola vez (no duplicado en `prompts.py` y `executor.py`).
- Como Claude, quiero herramientas formales con schemas claros para dar respuestas mas precisas.

## Requisitos

### Must Have

- [ ] FR-1: Definir tools en el API request para las 5 funciones motoras: `avanzar(velocidad)`, `retroceder(velocidad)`, `girar(angulo)`, `frenar()`, `set_velocidad(izq, der)` -- con parameter schemas JSON
- [ ] FR-2: Enviar datos de sensores como contenido estructurado, no string JSON raw
- [ ] FR-3: Parsear `tool_use` content blocks de la respuesta en vez de texto libre
- [ ] FR-4: Mantener `estrategia` como bloque de texto (Claude razona en texto, luego llama tools)
- [ ] FR-5: Actualizar `executor.py` para consumir tool_use blocks directamente
- [ ] FR-6: Fallback de compatibilidad: si API devuelve text-only (rate limit), intentar `_parse_claude_response`

### Nice to Have

- [ ] FR-7: Schema de tools auto-generado desde los metodos de `motors.py`
- [ ] FR-8: Logging de tool calls para debugging

## Criterios de Aceptacion

- [ ] AC-1: `claude_client.py` envia parametro `tools` en el API request
- [ ] AC-2: 0 excepciones `json.JSONDecodeError` en una sesion de 200 calls
- [ ] AC-3: Comportamiento del robot equivalente al actual en la misma arena
- [ ] AC-4: Token usage similar (~300 in, ~50 out)

## Dependencias

- **Requiere:** Nada (independiente, pero PRD-01 recomendado primero)
- **Habilita:** PRD-08 (prompt mejorado con herramientas estrategicas)

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `controllers/terrain_robot/claude_client.py` | Rewrite mayor: request/response con tool_use |
| `controllers/terrain_robot/executor.py` | Adaptar a tool_use blocks |
| `controllers/terrain_robot/prompts.py` | Simplificar (remover instrucciones de formato JSON) |
| `controllers/terrain_robot/docs/api_response_format.md` | Actualizar documentacion |

## Metricas de Exito

- Parse error rate: actual ~5% -> target 0%
- Token usage: sin cambio significativo
- Latencia: sin cambio (tool_use no agrega overhead)

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| `urllib.request` requiere headers correctos para tool_use | Baja | Medio | Header `anthropic-version: 2023-06-01` ya soporta tool_use |
| Claude podria no llamar tools y solo responder texto | Media | Bajo | FR-6 maneja fallback a text parsing |
| Schema de tools demasiado restrictivo | Baja | Bajo | Iterar schema basado en logs |

## Referencia Tecnica

API de Anthropic tool_use:
- Enviar array `tools` con `name`, `description`, `input_schema` (JSON Schema)
- Respuesta incluye content blocks tipo `tool_use` con `name` e `input`
- Compatible con model `claude-haiku-4-5-20251001` (el que usa el proyecto)

## Estimacion

**M (Medium)** - 4 archivos, cambio de formato de API + testing. ~4-6 horas.
