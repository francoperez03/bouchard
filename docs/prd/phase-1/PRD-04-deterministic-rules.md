# PRD-04: Deterministic Rules to Code

**Phase:** 1 | **Status:** Draft | **Esfuerzo:** S (Small)
**Fecha:** 2026-03-21

---

## Problema

Las reglas de velocidad por terreno estan definidas dos veces:
- En `prompts.py` linea 19 como texto: "metal=60, carpet=50, sand=35, rough=25, ramp=30"
- En `fallback.py` linea 9 como dict Python: `VELOCIDADES = {"metal": 60, ...}`

Claude esta siendo usado para aplicar reglas deterministicas que el codigo puede aplicar mas rapido y de forma mas confiable. Esto desperdicia tokens (~30% del prompt son reglas) y crea riesgo de inconsistencia.

Los umbrales de safety (`PROX_DANGER=150`, `TILT_ACCEL_Z_MIN=7.0` en safety.py) tambien estan hardcodeados sin un lugar central.

## User Stories

- Como sistema, quiero que las reglas deterministicas (limites de velocidad, umbrales) se apliquen en codigo para que Claude solo maneje decisiones genuinamente estrategicas.
- Como desarrollador, quiero una unica fuente de verdad para parametros de terreno para evitar inconsistencias.

## Requisitos

### Must Have

- [ ] FR-1: Crear modulo `terrain_rules.py` con dict/dataclass definiendo por terreno: velocidad base, umbral de slip, umbral de inclinacion, umbrales de obstaculo
- [ ] FR-2: `fallback.py` importa desde `terrain_rules.py` en vez de definir su propio `VELOCIDADES`
- [ ] FR-3: `prompts.py` remueve reglas deterministicas del system prompt (o las auto-genera desde el dict como contexto informativo)
- [ ] FR-4: Umbrales de `safety.py` (`PROX_DANGER`, `TILT_ACCEL_Z_MIN`) se mueven a `terrain_rules.py`
- [ ] FR-5: El system prompt cambia el rol de Claude de "aplica estas reglas de velocidad" a "dada la situacion del robot, decide estrategia de alto nivel"

### Nice to Have

- [ ] FR-6: Propiedades de terreno configurables via archivo JSON externo
- [ ] FR-7: Tipo por terreno como Enum en vez de strings magicos

## Criterios de Aceptacion

- [ ] AC-1: `VELOCIDADES` dict existe en exactamente 1 archivo (`terrain_rules.py`)
- [ ] AC-2: System prompt no contiene valores numericos de velocidad hardcodeados
- [ ] AC-3: Robot conduce a las mismas velocidades que antes para cada tipo de terreno
- [ ] AC-4: `grep -r "PROX_DANGER" controllers/` muestra solo `terrain_rules.py` y sus importadores

## Dependencias

- **Requiere:** Nada
- **Habilita:** PRD-07 (ambas capas comparten reglas desde terrain_rules), PRD-08 (prompt se enfoca en estrategia)

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `controllers/terrain_robot/terrain_rules.py` | **Nuevo**: fuente unica de reglas y constantes |
| `controllers/terrain_robot/fallback.py` | Import desde terrain_rules, borrar VELOCIDADES local |
| `controllers/terrain_robot/safety.py` | Import umbrales desde terrain_rules |
| `controllers/terrain_robot/prompts.py` | Simplificar prompt, remover reglas |

## Metricas de Exito

- Tokens del system prompt: reduccion ~30% (remover texto de reglas)
- Archivos con constantes duplicadas: 3 -> 1
- Cambio de comportamiento: 0 (refactoring puro)

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Ninguno significativo | - | - | Es refactoring puro sin cambio de comportamiento |

## Estructura Propuesta

```python
# terrain_rules.py

TERRAIN_SPEEDS = {
    "metal": 60,
    "carpet": 50,
    "sand": 35,
    "rough": 25,
    "ramp": 30,
}

SAFETY_THRESHOLDS = {
    "prox_danger": 150,
    "prox_warning": 100,
    "tilt_accel_z_min": 7.0,
    "slip_max": 0.3,
    "incline_max": 10,  # grados
    "warmup_cycles": 50,
}

SENSOR_ANGLES = {
    "ps0": 0,      # frontal derecho
    "ps1": 45,
    "ps2": 90,
    "ps3": 150,
    "ps4": 210,
    "ps5": 270,
    "ps6": 315,
    "ps7": 0,      # frontal izquierdo
}
```

## Estimacion

**S (Small)** - 4 archivos, sin cambio de comportamiento. ~2 horas.
