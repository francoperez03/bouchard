# PRD-17: Remote Command Interface

**Phase:** 5 | **Status:** Draft | **Esfuerzo:** M (Medium)
**Fecha:** 2026-03-21

---

## Problema

El robot opera de forma completamente autonoma. No hay forma de intervencion humana una vez que `terrain_robot.py` arranca. Durante desarrollo y demos, es comun necesitar: "mover el robot un poco a la izquierda para testear esa esquina", "frenar el robot que se va a caer de la rampa", o "dejar que Claude maneje pero poder tomar el control en cualquier momento".

Los comandos de motor ya estan abstraidos en `motors.py`: `avanzar(velocidad)`, `retroceder(velocidad)`, `girar(grados, velocidad)`, `frenar()`, `set_velocidad(izq, der)`. El `executor.py` (lineas 1-33) ya sabe parsear y ejecutar acciones `{"fn": "avanzar", "args": {"velocidad": 50}}`. Lo que falta es un canal de entrada para que un humano pueda emitir estos comandos desde un browser, una cola thread-safe que los encole, y que el main loop los consuma respetando la seguridad.

La distincion critica es que el reflex layer (`reflex_layer.py`, PRD-07) debe mantener prioridad sobre comandos manuales: si el usuario dice "avanzar 100" pero hay un obstaculo al frente, el reflex de emergencia debe frenar. La capa de seguridad nunca se deshabilita.

## User Stories

- Como desarrollador, quiero enviar comandos de motor al robot desde mi navegador para testear comportamientos especificos sin modificar codigo.
- Como usuario en demo, quiero un switch "manual/autonomo" que me deje tomar control del robot y devolverlo a Claude con un click.
- Como sistema de seguridad, quiero que los reflejos de emergencia siempre tengan prioridad sobre comandos manuales para que un usuario no pueda chocar el robot intencionalmente.
- Como usuario remoto, quiero poder controlar el robot desde otra computadora via un tunel seguro para demos distribuidas.

## Requisitos

### Must Have

- [ ] **FR-1**: Crear `controllers/terrain_robot/command_queue.py` con clase `CommandQueue` thread-safe (`queue.Queue` o `collections.deque` con `threading.Lock`). Metodos: `push(command_dict)`, `pop() -> command_dict | None`, `clear()`, `size() -> int`. Tamano maximo de cola: 10 comandos (descarta los mas viejos si se excede)
- [ ] **FR-2**: Extender `api_server.py` (creado en PRD-16) con endpoint `POST /api/command` que acepta JSON:
  ```json
  {"fn": "avanzar", "args": {"velocidad": 50}}
  ```
  Validar que `fn` esta en whitelist: `["avanzar", "retroceder", "girar", "frenar", "set_velocidad", "set_mode"]`. Retornar `{"status": "queued", "queue_size": N}` o `{"status": "error", "message": "..."}`
- [ ] **FR-3**: Comando especial `set_mode`: `{"fn": "set_mode", "args": {"mode": "manual"}}` o `"autonomous"`. En modo manual, el strategy layer no llama a Claude; en modo autonomous, funciona como hasta ahora. El reflex layer corre en ambos modos
- [ ] **FR-4**: En `terrain_robot.py`, en cada iteracion del main loop, consumir un comando de la cola:
  - Si hay comando y modo es "manual": ejecutar via `executor.execute_plan([cmd], motors)`
  - Si modo es "autonomous": ignorar comandos manuales (excepto `set_mode` y `frenar`)
  - `frenar()` siempre se acepta en ambos modos como parada de emergencia del usuario
- [ ] **FR-5**: Integracion con reflex layer: despues de ejecutar comando manual, evaluar reflexes. Si `reflex.emergency == True`, frenar inmediatamente (override del comando manual). Log: `"[safety] Manual command overridden by reflex: {reflex.description}"`
- [ ] **FR-6**: Componente React `CommandPanel` en `web/src/components/CommandPanel.tsx`: botones visuales para cada accion del motor. Layout tipo D-pad/gamepad:
  - Arriba: Avanzar
  - Abajo: Retroceder
  - Izquierda: Girar -45°
  - Derecha: Girar +45°
  - Centro: Frenar (rojo)
  - Slider: velocidad (0-100, default 50)
- [ ] **FR-7**: Componente React `ModeSwitch` en `web/src/components/ModeSwitch.tsx`: toggle switch "Manual / Autonomo" con confirmacion visual del modo actual. Cuando cambia a manual, el panel de comandos se habilita; cuando cambia a autonomo, se deshabilita (greyed out)
- [ ] **FR-8**: Feedback visual en `CommandPanel`: cuando un comando es enviado, mostrar toast/badge con resultado ("Queued" en verde, "Overridden by safety" en amarillo, "Error" en rojo). Informacion del override viene via WebSocket como mensaje tipo:
  ```json
  {
    "type": "command_result",
    "data": {
      "fn": "avanzar",
      "result": "overridden",
      "reason": "emergency: obstacle ps0=160"
    }
  }
  ```

### Nice to Have

- [ ] **FR-9**: Soporte para keyboard shortcuts: W/Up=avanzar, S/Down=retroceder, A/Left=girar izquierda, D/Right=girar derecha, Space=frenar, M=toggle modo
- [ ] **FR-10**: Comando `set_velocidad` con dos sliders independientes (izquierdo/derecho) para control diferencial fino
- [ ] **FR-11**: Historial de comandos enviados (ultimos 20) con timestamp y resultado, en panel scrollable
- [ ] **FR-12**: Documentar acceso remoto via `ngrok http 8765` o `cloudflared tunnel` en el README. Nota de seguridad: no exponer sin autenticacion en redes publicas
- [ ] **FR-13**: Rate limiting en el endpoint POST: maximo 10 comandos por segundo por cliente para prevenir flooding

## Criterios de Aceptacion

- [ ] **AC-1**: Un comando POST a `/api/command` con `{"fn": "avanzar", "args": {"velocidad": 50}}` resulta en movimiento visible del robot en Webots dentro de 500ms
- [ ] **AC-2**: En modo manual, el robot responde a comandos del frontend. En modo autonomo, los comandos manuales (excepto `set_mode` y `frenar`) son ignorados con respuesta `{"status": "ignored", "reason": "autonomous mode"}`
- [ ] **AC-3**: Cuando el robot recibe un comando manual de avanzar y hay un obstaculo frontal (ps0 > 150), el reflex frena el robot en el mismo step y el frontend recibe notificacion de override
- [ ] **AC-4**: El switch de modo en el frontend cambia el modo del robot en < 1 segundo y se refleja en el `MetricsBar` del dashboard (PRD-16)
- [ ] **AC-5**: El `CommandQueue` no causa deadlocks ni race conditions bajo carga de 10 comandos/segundo
- [ ] **AC-6**: `frenar()` funciona en ambos modos (manual y autonomo) como comando de emergencia del usuario

## Dependencias

- **Requiere:** PRD-07 (reflex layer para safety override de comandos manuales), PRD-15 (shell React para montar componentes), PRD-16 (api_server.py para extender con endpoint POST, SharedState para reportar mode y command results via WebSocket)
- **Habilita:** Demos interactivas, testing manual de escenarios especificos, potencial para joystick/gamepad integration futura

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `controllers/terrain_robot/command_queue.py` | **Nuevo**: clase CommandQueue thread-safe |
| `controllers/terrain_robot/api_server.py` | Extender: agregar `POST /api/command` endpoint, inyectar referencia a CommandQueue |
| `controllers/terrain_robot/terrain_robot.py` | Modificar: instanciar CommandQueue, consumir comandos en main loop (~linea 65), agregar variable `mode`, pasar mode a SharedState |
| `controllers/terrain_robot/executor.py` | Modificar: retornar resultado (dict) en vez de solo print, agregar validacion de whitelist |
| `web/src/pages/ControlPage.tsx` | Reemplazar placeholder con panel de control real |
| `web/src/components/CommandPanel.tsx` | **Nuevo**: botones de control tipo D-pad |
| `web/src/components/ModeSwitch.tsx` | **Nuevo**: toggle manual/autonomo |
| `web/src/hooks/useCommands.ts` | **Nuevo**: hook para enviar POST a `/api/command` con manejo de errores y feedback |
| `web/src/types/commands.ts` | **Nuevo**: tipos TypeScript para CommandRequest, CommandResponse |

## Metricas de Exito

| Metrica | Target |
|---------|--------|
| Latencia comando (click -> movimiento en Webots) | < 500ms |
| Tasa de override correctos por reflex layer | 100% (nunca permitir comando inseguro) |
| Tamano del CommandQueue en operacion normal | < 3 comandos en cola |
| Tiempo de cambio de modo (manual <-> autonomo) | < 1 segundo |
| Commands procesados sin error | > 99% (con input valido) |

## Riesgos

| Riesgo | Prob | Impacto | Mitigacion |
|--------|------|---------|------------|
| Usuario envia comandos mas rapido que el loop los consume (32ms/step) | Media | Bajo | Cola con tamano maximo 10; descarte de comandos antiguos; rate limiting (FR-13) |
| Modo manual causa que el robot se pierda respecto al mapa/goals | Media | Medio | Al volver a autonomo, strategy layer recalcula estado desde pose actual y mapa. No se pierde el mapa |
| Race condition entre command_queue.pop() y reflex override | Baja | Alto | El main loop es single-threaded: pop -> execute -> reflex check es secuencial. No hay race |
| Exposicion via ngrok sin autenticacion | Baja | Alto | Default es localhost. Documentar que ngrok es solo para demos en red confiable. FR-12 incluye nota de seguridad |
| Flooding de comandos causa lag en el main loop | Baja | Medio | `pop()` retorna un solo comando por step; la cola es un buffer. El main loop nunca procesa mas de 1 comando por iteracion |

## Flujo del Main Loop Modificado

```python
while robot.step(timestep) != -1:
    if motors.girando:
        motors.girar_completo()
        continue

    data = sensors.read_all(motors.get_velocidad_comandada())
    occ_map.update(data["pose"], data)
    step_count += 1

    # --- NUEVO: Consumir comando manual ---
    cmd = command_queue.pop()
    if cmd:
        if cmd["fn"] == "set_mode":
            mode = cmd["args"]["mode"]
        elif cmd["fn"] == "frenar":
            motors.frenar()  # siempre permitido
        elif mode == "manual":
            executor.execute_plan([cmd], motors)

    # Capa reflexiva (siempre corre, ambos modos)
    reflex = reflexes.update(data)

    # Safety override de comando manual
    if reflex.emergency:
        motors.frenar()
        if reflex.heading_override:
            motors.retroceder(reflex.velocity)
            for _ in range(15):
                robot.step(timestep)
            motors.girar(reflex.heading_override)
        action = reflex.description
    elif mode == "autonomous":
        # Capa estrategica (solo en autonomo)
        strat = strategy.update(data, step_count, map_data=occ_map.get_compact_map())
        if strat.has_action:
            if strat.target_heading is not None and abs(strat.target_heading) > 5:
                motors.girar(int(strat.target_heading))
            elif strat.target_speed is not None:
                motors.avanzar(strat.target_speed)
            action = strat.description
        elif reflex.heading_override:
            motors.girar(reflex.heading_override)
            action = reflex.description
        else:
            motors.avanzar(reflex.velocity)
            action = reflex.description
    else:
        # Modo manual: no hacer nada adicional (comando ya ejecutado arriba)
        action = f"manual: {cmd['fn']}" if cmd else "manual: idle"

    shared_state.update(data, reflex, strat_if_any, occ_map, step_count, mode)
    logger.log(data, safety_status="ok", action=action)
```

## Estimacion

**M (Medium)** — CommandQueue es simple (stdlib Python), endpoint POST extiende servidor existente (PRD-16), componentes React son UI sin logica compleja. La integracion con el main loop requiere cuidado pero no es algoritmicamente dificil. ~6-8 horas.
