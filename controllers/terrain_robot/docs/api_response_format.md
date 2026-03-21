# Claude API - Tool Use Format

## Overview

The robot controller uses the Anthropic `tool_use` API to get structured navigation
commands. Instead of asking Claude to produce JSON text, we define motor functions as
tools. Claude responds with `tool_use` blocks that map directly to motor commands.

## Request

The request includes sensor data as the user message and motor functions as tools.

```json
{
  "model": "claude-haiku-4-5-20251001",
  "max_tokens": 300,
  "system": "Robot e-puck 2WD en Webots. Analizá sensores y decidí acciones...",
  "tools": [
    {
      "name": "avanzar",
      "description": "Avanzar recto a velocidad indicada.",
      "input_schema": {
        "type": "object",
        "properties": {
          "velocidad": {"type": "integer", "minimum": 0, "maximum": 100}
        },
        "required": ["velocidad"]
      }
    },
    {
      "name": "girar",
      "description": "Girar N grados. Positivo=derecha, negativo=izquierda.",
      "input_schema": {
        "type": "object",
        "properties": {
          "grados": {"type": "integer"},
          "velocidad": {"type": "integer", "minimum": 0, "maximum": 100}
        },
        "required": ["grados"]
      }
    }
  ],
  "messages": [
    {"role": "user", "content": "{\"ps\":{\"ps0\":45.2},\"terreno\":\"sand\",\"slip\":0.1,...}"}
  ]
}
```

### User message format

Sensor data as compact JSON. Only active proximity sensors (value > 10) are included.

```json
{"ps": {"ps0": 45.2, "ps7": 38.1}, "terreno": "carpet", "slip": 0.0, "incl": 0.1, "front": 38.1, "side": 12.5, "vib": 0.05}
```

With history (last 2 readings):
```
Hist: [{"ps":{},"terreno":"carpet","slip":0,...}, {"ps":{"ps0":12},...}]
Ahora: {"ps":{"ps0":45.2},"terreno":"sand","slip":0.1,...}
```

## Response

Claude responds with a `content` array containing `text` blocks (strategy reasoning)
and `tool_use` blocks (motor commands).

### Example: advance on carpet

```json
{
  "content": [
    {
      "type": "text",
      "text": "Terreno carpet sin obstáculos, avanzo a velocidad moderada."
    },
    {
      "type": "tool_use",
      "id": "toolu_01A...",
      "name": "avanzar",
      "input": {"velocidad": 50}
    }
  ],
  "stop_reason": "tool_use"
}
```

### Example: obstacle avoidance

```json
{
  "content": [
    {
      "type": "text",
      "text": "Obstáculo frontal detectado, retrocedo y giro a la izquierda."
    },
    {
      "type": "tool_use",
      "id": "toolu_01B...",
      "name": "retroceder",
      "input": {"velocidad": 30}
    },
    {
      "type": "tool_use",
      "id": "toolu_01C...",
      "name": "girar",
      "input": {"grados": -90}
    }
  ],
  "stop_reason": "tool_use"
}
```

### Parsed plan (internal format)

The client parses the response into this dict:

```python
{
    "estrategia": "Obstáculo frontal detectado, retrocedo y giro a la izquierda.",
    "acciones": [
        {"fn": "retroceder", "args": {"velocidad": 30}},
        {"fn": "girar", "args": {"grados": -90}},
    ]
}
```

## Tools (5 motor functions)

| Tool | Required args | Optional args | Description |
|---|---|---|---|
| `avanzar` | `velocidad` (0-100) | | Avanzar recto |
| `retroceder` | `velocidad` (0-100) | | Marcha atrás |
| `girar` | `grados` (+der/-izq) | `velocidad` (0-100) | Giro en el lugar |
| `frenar` | (ninguno) | | Freno total |
| `set_velocidad` | `izq`, `der` (0-100) | | Control independiente por motor |

## Fallback

If Claude responds with only a `text` block and no `tool_use` blocks (e.g. rate-limited
or degraded mode), the client falls back to parsing the text as JSON using the legacy
format. The `_parse_claude_response()` function handles markdown-wrapped JSON.

## Costs per request (Haiku 4.5)

- Input: ~400 tokens (~$0.00032) - slightly higher due to tool schemas
- Output: ~60 tokens (~$0.00024)
- Total per request: ~$0.0006
- Limit per session: 200 calls (~$0.12)
