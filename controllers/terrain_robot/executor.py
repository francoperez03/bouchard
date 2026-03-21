def execute_plan(plan, motors):
    """Interpreta un plan JSON de Claude y ejecuta las acciones."""
    if not plan or "acciones" not in plan:
        return

    for accion in plan["acciones"]:
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
