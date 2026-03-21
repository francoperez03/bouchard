# Claude API - Formato de Request/Response

## Request (user message)

Datos compactos del robot. Solo sensores con valor > 10.

```json
{
  "ps": {"ps0": 45.2, "ps7": 38.1, "ps1": 67.3},
  "terreno": "carpet",
  "slip": 0.0,
  "incl": 0.1,
  "front": 38.1,
  "side": 12.5,
  "vib": 0.05
}
```

Con historial:
```
Hist: [{"ps":{},"terreno":"carpet","slip":0,...}, {"ps":{"ps0":12},...}]
Ahora: {"ps":{"ps0":45.2},"terreno":"sand","slip":0.1,...}
```

## Response esperada

JSON con terreno detectado, estrategia en 1 línea, y lista de acciones a ejecutar.

```json
{
  "terreno": "carpet",
  "estrategia": "Avanzar con velocidad moderada en carpet, sensores sin obstáculos críticos",
  "acciones": [
    {"fn": "avanzar", "args": {"velocidad": 50}}
  ]
}
```

## Ejemplos reales de respuestas

### Avance normal en carpet
```json
{
  "terreno": "carpet",
  "estrategia": "Avanzar explorando, sensores moderados sin obstáculos críticos",
  "acciones": [{"fn": "avanzar", "args": {"velocidad": 50}}]
}
```

### Avance en arena
```json
{
  "terreno": "sand",
  "estrategia": "Avance controlado en arena con monitoreo de obstáculos distribuidos",
  "acciones": [{"fn": "avanzar", "args": {"velocidad": 35}}]
}
```

### Esquivar obstáculo
```json
{
  "terreno": "metal",
  "estrategia": "Obstáculo frontal detectado, retroceder y girar a la izquierda",
  "acciones": [
    {"fn": "retroceder", "args": {"velocidad": 30}},
    {"fn": "girar", "args": {"grados": -90}}
  ]
}
```

## Funciones disponibles

| Función | Args | Descripción |
|---|---|---|
| `avanzar` | `velocidad` (0-100) | Avanzar recto |
| `retroceder` | `velocidad` (0-100) | Marcha atrás |
| `girar` | `grados` (+der/-izq) | Giro en el lugar |
| `frenar` | (ninguno) | Freno total |
| `set_velocidad` | `izq`, `der` (0-100) | Control independiente por motor |

## Costos por request (Haiku 4.5)

- Input: ~300 tokens (~$0.00024)
- Output: ~50 tokens (~$0.0002)
- Total por request: ~$0.0004
- Límite por sesión: 200 calls (~$0.08)

## Nota

Claude a veces wrappea la respuesta en ```json ... ```. El parser en `claude_client.py` lo limpia automáticamente.
