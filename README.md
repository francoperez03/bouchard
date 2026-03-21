# Bouchard

Autonomous robot with AI-powered strategic navigation. An e-puck in Webots that explores a multi-terrain arena using two layers of intelligence: instant reflexes + planning with Claude.

Named after Hipolito Bouchard, the Argentine corsair who navigated hostile terrain with strategy and audacity.

## Architecture

```
Sensors (8 IR + IMU + odometry)
    |
    v
+-------------------+     +---------------------+
| Reflex Layer      |     | Strategy Layer      |
| (every step, 32ms)|     | (periodic, Claude)  |
| - Obstacles       |     | - Occupancy map     |
| - Terrain         |     | - Frontiers         |
| - Emergencies     |     | - Goals             |
+-------------------+     +---------------------+
    |                           |
    |   reflexes > strategy     |
    v                           v
+-------------------------------+
|          Motors               |
|    (differential, e-puck)    |
+-------------------------------+
```

**Reflex layer** — runs every 32ms. Detects obstacles, classifies terrain (metal, sand, carpet, rough, ramp), compensates for slip, and brakes on emergencies. Doesn't think, reacts.

**Strategy layer** — queries Claude periodically. Analyzes the occupancy map, identifies unexplored frontiers, and decides where to explore. Doesn't control motors, plans routes.

When in conflict, reflexes always win.

## The Arena

3x3m arena in Webots with 5 terrain types:

| Terrain | Friction | Speed | Behavior |
|---------|----------|-------|----------|
| Metal | Low | 60% | Smooth surface, high traction |
| Sand | Variable | 35% | High slip, slip compensation active |
| Carpet | High | 50% | Stable navigation |
| Rough | Irregular | 25% | High vibration, stability monitoring |
| Ramp | Medium | 30% | Power adjustment for gravity |

Obstacles: oil barrels, traffic cones, wooden/cardboard boxes, plastic crates.

## Requirements

- [Webots R2025a](https://cyberbotics.com/)
- Python 3.10+ (bundled with Webots)
- Node.js 20+ (for the web dashboard)
- An [Anthropic](https://console.anthropic.com/) API key (optional — works without it in fallback mode)

## Setup

```bash
git clone https://github.com/francoperez03/bouchard.git
cd bouchard
```

### 1. Configure API key (optional)

```bash
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY
```

Or export directly:

```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Without an API key the robot runs in **fallback mode** with heuristic navigation.

### 2. Run the robot

1. Open Webots
2. File → Open World → `worlds/terrain_arena.wbt`
3. Click Run

The controller starts automatically, reads sensors, and navigates the arena. An API server spins up at `http://localhost:8765`.

### 3. Web dashboard

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:5173`. Three views:

- **Landing** (`/`) — project overview
- **Status** (`/status`) — real-time sensors, occupancy map, layer status
- **Control** (`/control`) — remote control with D-pad, autonomous/manual mode switching

## Project Structure

```
bouchard/
├── worlds/
│   └── terrain_arena.wbt          # 3x3m arena with 5 terrains
├── controllers/terrain_robot/
│   ├── terrain_robot.py           # Main loop
│   ├── sensors.py                 # 8 IR + accel + gyro + odometry
│   ├── motors.py                  # Differential drive
│   ├── reflex_layer.py            # Reflex layer (every step)
│   ├── strategy_layer.py          # Strategy layer (periodic)
│   ├── claude_client.py           # Claude API + tool use + cache
│   ├── occupancy_map.py           # 5cm resolution grid
│   ├── goal_manager.py            # Goal state machine
│   ├── feedback.py                # Outcome feedback to Claude
│   ├── history_manager.py         # Session history compression
│   ├── terrain_rules.py           # Terrain constants and safety thresholds
│   ├── api_server.py              # HTTP server for dashboard
│   ├── executor.py                # Executes JSON plans
│   ├── fallback.py                # Navigation without Claude
│   ├── prompts.py                 # System prompt
│   ├── config.py                  # Reads ANTHROPIC_API_KEY from env
│   └── logger.py                  # CSV logging
├── web/                           # React + Vite dashboard
│   ├── src/
│   │   ├── pages/                 # Landing, Status, Control
│   │   ├── components/            # SensorPanel, MapCanvas, CommandPanel...
│   │   ├── components/landing/    # Hero, CapabilitiesGrid, TerrenosSection...
│   │   ├── contexts/              # WebSocket connection
│   │   ├── hooks/                 # useRobotState, useCommands
│   │   └── types/                 # TypeScript interfaces
│   └── public/
│       └── arena-demo.mov         # Simulation video
├── scripts/
│   ├── dashboard.py               # Log visualization with matplotlib
│   └── benchmark.py               # Run comparison
├── docs/prd/                      # Product Requirements (17 PRDs, 5 phases)
└── requirements.txt               # matplotlib
```

## How It Works

Every 32ms cycle:

1. **Sensors** — reads 8 IR, accelerometer, gyroscope, encoders. Computes pose via dead-reckoning.
2. **Map** — updates occupancy grid with ray-casting from each sensor. Marks cells as free, occupied, or frontier.
3. **Reflexes** — determines safe speed based on terrain, slip, tilt. If danger is detected, immediate override.
4. **Strategy** (every ~300 steps) — sends compressed map to Claude. Claude chooses between: explore frontier, backtrack, patrol area, or investigate point of interest.
5. **Motors** — executes the resulting command with differential drive.
6. **Log** — records telemetry and action to CSV.

### Claude Tool Use

Claude doesn't receive free-form text. It uses structured tools:

```
set_exploration_target(x, y)    → go to coordinate
backtrack()                     → return to safe zone
patrol_area(x1, y1, x2, y2)    → patrol rectangle
investigate(x, y)               → inspect point
```

Responses are cached (TTL: 500 steps) to avoid redundant calls. Max 200 calls per session.

## Thesis

> Claude navigates >30% better than simple heuristics when it has a partial map and complex arenas.

Without the map, the AI can only react to what's immediately around it. With the map, it picks high-value frontiers, avoids already-mapped zones, and plans multi-step exploration sequences.

## Analyze Results

```bash
# Visualize a run
python scripts/dashboard.py controllers/terrain_robot/terrain_log.csv

# Compare multiple runs
python scripts/benchmark.py analyze --dir results/
```

## Operation Modes

| Mode | Description |
|------|-------------|
| **Autonomous + Claude** | AI strategy + reflexes. The robot explores on its own. |
| **Autonomous fallback** | No API key. Heuristics + reflexes. |
| **Manual** | Remote control via dashboard. Reflexes stay active for safety. |

## Stack

- **Simulation**: Webots R2025a
- **Robot**: e-puck (differential drive, 8 IR, IMU)
- **AI**: Claude Haiku 4.5 (tool use)
- **Controller**: Python (stdlib only)
- **Dashboard**: React 19 + TypeScript + Tailwind CSS + Vite
- **Visualization**: matplotlib
