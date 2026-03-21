def execute_plan(plan, motors):
    """Interpreta un plan de Claude y ejecuta las acciones.
    Acepta dict con 'acciones' o lista directa de acciones."""
    if not plan:
        return

    if isinstance(plan, list):
        acciones = plan
    elif isinstance(plan, dict):
        acciones = plan.get("acciones", [])
    else:
        return

    for accion in acciones:
        fn = accion.get("fn")
        args = accion.get("args", {})

        try:
            if fn == "avanzar":
                motors.avanzar(**args)
            elif fn == "retroceder":
                motors.retroceder(**args)
            elif fn == "girar":
                motors.girar(**args)
            elif fn == "frenar":
                motors.frenar()
            elif fn == "set_velocidad":
                motors.set_velocidad(**args)
            else:
                print(f"[executor] Función desconocida: {fn}")
        except Exception as e:
            print(f"[executor] Error en {fn}({args}): {e}")
            motors.frenar()
