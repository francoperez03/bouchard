# PRD-01: Config Security

**Phase:** 1 | **Status:** Draft | **Esfuerzo:** S (Small)
**Fecha:** 2026-03-21

---

## Problema

`controllers/terrain_robot/config.py` (linea 5) tiene la API key de Anthropic hardcodeada como string literal. Aunque `.gitignore` excluye el archivo, cualquier `git add -f` o copia accidental expone credenciales. La key se importa directamente en `claude_client.py` (linea 5) y `terrain_robot.py` (linea 19).

Riesgo de seguridad real: si la key se commiteo alguna vez, queda en el historial de git.

## User Stories

- Como desarrollador, quiero que las API keys se carguen desde variables de entorno para que nunca puedan ser commiteadas accidentalmente.
- Como desarrollador, quiero un mensaje de error claro cuando la API key no esta configurada para saber exactamente que hacer.
- Como el robot, quiero arrancar en modo fallback automaticamente si no hay API key disponible.

## Requisitos

### Must Have

- [ ] FR-1: Leer `ANTHROPIC_API_KEY` desde `os.environ.get()` (convencion estandar del SDK de Anthropic)
- [ ] FR-2: `config.py` se convierte en wrapper: `CLAUDE_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")`
- [ ] FR-3: Crear `.env.example` documentando las variables requeridas
- [ ] FR-4: Validar formato de la key en `terrain_robot.py` (debe empezar con "sk-ant-")
- [ ] FR-5: Imprimir mensaje diagnostico especifico si la key falta vs. esta malformada

### Nice to Have

- [ ] FR-6: Soporte para archivo `.env` con `python-dotenv` (no agregar dependencia, solo documentar)
- [ ] FR-7: Warning en consola si config.py contiene strings que parecen keys

## Criterios de Aceptacion

- [ ] AC-1: Robot arranca correctamente con `ANTHROPIC_API_KEY` como variable de entorno
- [ ] AC-2: Robot arranca en modo fallback con mensaje claro cuando la env var no existe
- [ ] AC-3: `git grep -r "sk-ant" -- ':!.gitignore'` devuelve 0 resultados en archivos trackeados
- [ ] AC-4: `.env.example` existe con instrucciones de configuracion

## Dependencias

- **Requiere:** Nada (leaf node)
- **Habilita:** Todos los PRDs que usan Claude API (02, 03, 08, 09, 10)

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `controllers/terrain_robot/config.py` | Reescribir: env var en vez de hardcode |
| `controllers/terrain_robot/terrain_robot.py` | Actualizar check de import (linea 20) |
| `.env.example` | **Nuevo**: documentar variables requeridas |

## Metricas de Exito

- 0 secretos en archivos trackeados por git
- 0 cambios en comportamiento del robot (transparente)

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Webots no hereda env vars del shell | Media | Alto | Documentar `export` en .env.example, probar con Webots launcher |
| Desarrollador olvida setear la var | Baja | Bajo | Mensaje de error claro + fallback automatico |

## Estimacion

**S (Small)** - 3 archivos, logica trivial, ~1 hora de trabajo.
