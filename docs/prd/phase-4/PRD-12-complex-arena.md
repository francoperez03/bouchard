# PRD-12: Complex Arena

**Phase:** 4 | **Status:** Draft | **Esfuerzo:** L (Large)
**Fecha:** 2026-03-21

---

## Problema

La arena actual (`terrain_arena.wbt`) es 3x3m con ~9 obstaculos colocados a mano. Es demasiado simple para testear exploracion estrategica genuina. Un robot que random-walk eventualmente cubre la mayor parte. El valor de la planificacion estrategica de Claude solo emerge en entornos mas grandes y complejos.

## User Stories

- Como desarrollador, quiero una arena mas grande (15x15m) con obstaculos procedurales para poder testear si la exploracion guiada por Claude supera la exploracion random.
- Como sistema, quiero corredores, dead ends y habitaciones que requieran planificacion para navegar eficientemente.
- Como investigador, quiero arenas reproducibles (por seed) para benchmarks cientificos.

## Requisitos

### Must Have

- [ ] FR-1: Crear script Python que genere archivos `.wbt` con parametros configurables: tamano de arena, densidad de obstaculos, layout de zonas de terreno, ancho de corredores
- [ ] FR-2: Arena "compleja" default: 15x15m, 4+ tipos de terreno en zonas irregulares, corredores entre clusters de obstaculos, al menos 2 dead ends, al menos 1 habitacion (area cerrada con una sola entrada)
- [ ] FR-3: Generar al menos 3 variantes de arena para benchmarking (diferentes seeds)
- [ ] FR-4: Asegurar que las arenas son resolvibles: todo punto alcanzable desde la posicion inicial (sin areas aisladas)
- [ ] FR-5: Escalar resolucion del mapa de ocupacion apropiadamente (10cm celdas para 15x15 = 150x150 grid = 22,500 celdas)

### Nice to Have

- [ ] FR-6: Parametro de dificultad (facil/medio/dificil) que ajusta densidad y complejidad
- [ ] FR-7: Preview del layout generado como imagen PNG antes de correr
- [ ] FR-8: Terrenos dinamicos (zonas que cambian durante la simulacion)

## Criterios de Aceptacion

- [ ] AC-1: Arena generada carga en Webots sin errores
- [ ] AC-2: Robot puede navegar la arena por 30 minutos sin crashear Webots
- [ ] AC-3: Exploracion random cubre <30% de la arena en 10 minutos (comprobando que la arena es genuinamente compleja)
- [ ] AC-4: Al menos 3 variantes de arena deterministas se pueden generar desde seeds

## Dependencias

- **Requiere:** PRD-06 (mapa de ocupacion debe manejar grids mas grandes)
- **Habilita:** PRD-13 (benchmark necesita arena compleja para ser significativo)

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `scripts/generate_arena.py` | **Nuevo**: generador procedural de mundos Webots |
| `worlds/complex_arena_*.wbt` | **Nuevos**: archivos generados |
| `controllers/terrain_robot/occupancy_map.py` | Posible optimizacion de performance para grids mas grandes |

## Metricas de Exito

- Tiempo de generacion de arena <10 segundos
- Arena suficientemente compleja: exploracion random plateau <50% cobertura
- Webots performance estable con el mundo generado

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Performance de Webots con muchos objetos en 15x15m | Media | Alto | Usar geometrias simples (boxes), limitar objetos a ~100 |
| Formato VRML del .wbt es complejo de generar | Media | Medio | Usar la arena actual como template, replicar patrones |
| Arena generada tiene areas inaccesibles | Media | Alto | Verificacion de solvabilidad: flood fill desde posicion inicial |
| Mapa de ocupacion 150x150 es lento | Baja | Medio | 150x150 * 4 bytes = ~90KB, manejable; optimizar con numpy si necesario |

## Estructura del Generador

```python
# scripts/generate_arena.py

def generate_arena(
    size=(15, 15),        # metros
    seed=42,
    obstacle_density=0.15, # % del area con obstaculos
    num_terrains=4,
    corridor_width=0.4,    # metros
    num_dead_ends=2,
    num_rooms=1,
    output_path="worlds/complex_arena.wbt"
):
    """Genera un mundo Webots con terrenos y obstaculos procedurales."""
    ...

# Uso:
# python scripts/generate_arena.py --seed 42 --size 15 --difficulty medium
```

## Estimacion

**L (Large)** - Generacion de mundos Webots requiere entender formato VRML, algoritmos de colocacion procedural, verificacion de solvabilidad. ~6-8 horas.
