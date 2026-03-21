# Bouchard

Robot autonomo con navegacion estrategica por IA. Un e-puck en Webots que explora una arena de terrenos variados usando dos capas de inteligencia: reflejos instantaneos + planificacion con Claude.

Nombrado en honor a Hipolito Bouchard, corsario argentino que navegaba terreno hostil con estrategia.

## Arquitectura

```
Sensores (8 IR + IMU + odometria)
    |
    v
+-------------------+     +---------------------+
| Capa Reflexiva    |     | Capa Estrategica    |
| (cada step, 32ms) |     | (periodica, Claude) |
| - Obstaculos      |     | - Mapa de ocupacion |
| - Terreno         |     | - Fronteras         |
| - Emergencias     |     | - Objetivos         |
+-------------------+     +---------------------+
    |                           |
    |   reflexes > strategy     |
    v                           v
+-------------------------------+
|         Motores               |
|   (diferencial, e-puck)      |
+-------------------------------+
```

**Capa reflexiva** — corre cada 32ms. Detecta obstaculos, clasifica terreno (metal, arena, carpet, rough, rampa), compensa deslizamiento, y frena en emergencias. No piensa, reacciona.

**Capa estrategica** — consulta a Claude periodicamente. Analiza el mapa de ocupacion, identifica fronteras inexploradas, y decide hacia donde explorar. No controla motores, planifica rutas.

En caso de conflicto, los reflejos siempre ganan.

## La arena

Arena de 3x3m en Webots con 5 tipos de terreno:

| Terreno | Friccion | Velocidad | Comportamiento |
|---------|----------|-----------|----------------|
| Metal | Baja | 60% | Superficie lisa, traccion alta |
| Arena | Variable | 35% | Deslizamiento alto, compensacion de slip |
| Carpet | Alta | 50% | Navegacion estable |
| Rough | Irregular | 25% | Vibracion alta, monitoreo de estabilidad |
| Rampa | Media | 30% | Ajuste de potencia por gravedad |

Obstaculos: oil barrels, traffic cones, cajas de madera/carton, plastic crates.

## Requisitos

- [Webots R2025a](https://cyberbotics.com/)
- Python 3.10+ (viene con Webots)
- Node.js 20+ (para el dashboard web)
- Una API key de [Anthropic](https://console.anthropic.com/) (opcional, funciona sin ella en modo fallback)

## Setup

```bash
git clone https://github.com/francoperez03/bouchard.git
cd bouchard
```

### 1. Configurar API key (opcional)

```bash
cp .env.example .env
# Editar .env con tu ANTHROPIC_API_KEY
```

O exportar directamente:

```bash
export ANTHROPIC_API_KEY=sk-ant-tu-key-aqui
```

Sin API key el robot funciona en **modo fallback** con heuristicas de navegacion.

### 2. Correr el robot

1. Abrir Webots
2. File → Open World → `worlds/terrain_arena.wbt`
3. Click Run

El controller arranca automaticamente, lee sensores, y navega la arena. Un servidor API se levanta en `http://localhost:8765`.

### 3. Dashboard web

```bash
cd web
npm install
npm run dev
```

Abrir `http://localhost:5173`. Tres vistas:

- **Landing** (`/`) — overview del proyecto
- **Status** (`/status`) — sensores en tiempo real, mapa de ocupacion, estado de capas
- **Control** (`/control`) — control remoto con D-pad, cambio de modo autonomo/manual

## Estructura del proyecto

```
bouchard/
├── worlds/
│   └── terrain_arena.wbt          # Arena 3x3m con 5 terrenos
├── controllers/terrain_robot/
│   ├── terrain_robot.py           # Loop principal
│   ├── sensors.py                 # 8 IR + accel + gyro + odometria
│   ├── motors.py                  # Control diferencial
│   ├── reflex_layer.py            # Capa reflexiva (cada step)
│   ├── strategy_layer.py          # Capa estrategica (periodica)
│   ├── claude_client.py           # Claude API + tool use + cache
│   ├── occupancy_map.py           # Grid 5cm de resolucion
│   ├── goal_manager.py            # Estado de objetivos
│   ├── feedback.py                # Feedback de resultados a Claude
│   ├── history_manager.py         # Compresion de historial
│   ├── terrain_rules.py           # Constantes de terreno y seguridad
│   ├── api_server.py              # HTTP server para dashboard
│   ├── executor.py                # Ejecuta planes JSON
│   ├── fallback.py                # Navegacion sin Claude
│   ├── prompts.py                 # System prompt
│   ├── config.py                  # Lee ANTHROPIC_API_KEY del env
│   └── logger.py                  # Log CSV
├── web/                           # Dashboard React + Vite
│   ├── src/
│   │   ├── pages/                 # Landing, Status, Control
│   │   ├── components/            # SensorPanel, MapCanvas, CommandPanel...
│   │   ├── components/landing/    # Hero, CapabilitiesGrid, TerrenosSection...
│   │   ├── contexts/              # WebSocket connection
│   │   ├── hooks/                 # useRobotState, useCommands
│   │   └── types/                 # TypeScript interfaces
│   └── public/
│       └── arena-demo.mov         # Video de la simulacion
├── scripts/
│   ├── dashboard.py               # Visualizacion de logs con matplotlib
│   └── benchmark.py               # Comparacion de runs
├── docs/prd/                      # Product Requirements (17 PRDs, 5 fases)
└── requirements.txt               # matplotlib
```

## Como funciona

Cada ciclo de 32ms:

1. **Sensores** — lee 8 IR, acelerometro, giroscopio, encoders. Calcula pose por dead-reckoning.
2. **Mapa** — actualiza occupancy grid con ray-casting desde cada sensor. Marca celdas libres, ocupadas, y fronteras.
3. **Reflejos** — determina velocidad segura segun terreno, slip, inclinacion. Si hay peligro, override inmediato.
4. **Estrategia** (cada ~300 steps) — envia mapa comprimido a Claude. Claude elige entre: explorar frontera, backtrack, patrullar area, o investigar punto de interes.
5. **Motores** — ejecuta el comando resultante con control diferencial.
6. **Log** — graba telemetria y accion en CSV.

### Tool use de Claude

Claude no recibe texto libre. Usa herramientas estructuradas:

```
set_exploration_target(x, y)    → ir a coordenada
backtrack()                     → volver a zona segura
patrol_area(x1, y1, x2, y2)    → patrullar rectangulo
investigate(x, y)               → inspeccionar punto
```

Las respuestas se cachean (TTL: 500 steps) para evitar llamadas redundantes. Maximo 200 calls por sesion.

## Tesis

> Claude navega >30% mejor que heuristicas simples cuando tiene un mapa parcial y arenas complejas.

Sin el mapa, la IA solo reacciona a lo inmediato. Con el mapa, elige fronteras de alto valor, evita zonas mapeadas, y planifica secuencias multi-paso.

## Analisis de resultados

```bash
# Visualizar un run
python scripts/dashboard.py controllers/terrain_robot/terrain_log.csv

# Comparar multiples runs
python scripts/benchmark.py analyze --dir results/
```

## Modos de operacion

| Modo | Descripcion |
|------|-------------|
| **Autonomo + Claude** | Estrategia IA + reflejos. El robot explora solo. |
| **Autonomo fallback** | Sin API key. Heuristicas + reflejos. |
| **Manual** | Control remoto via dashboard. Reflejos siguen activos por seguridad. |

## Stack

- **Simulacion**: Webots R2025a
- **Robot**: e-puck (diferencial, 8 IR, IMU)
- **IA**: Claude Haiku 4.5 (tool use)
- **Controller**: Python (stdlib)
- **Dashboard**: React 19 + TypeScript + Tailwind CSS + Vite
- **Visualizacion**: matplotlib
