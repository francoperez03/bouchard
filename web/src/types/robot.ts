export interface SensorData {
  proximidad: Record<string, number>;
  accel: { x: number; y: number; z: number };
  gyro: { x: number; y: number; z: number };
  vibracion: number;
  avance_real: number;
  odometria: { izq: number; der: number };
  terreno_detectado: string;
  slip_ratio: number;
  inclinacion: number;
  front_min: number;
  side_min: number;
  pose: Pose;
}

export interface Pose {
  x: number;
  y: number;
  theta: number;
}

export interface ReflexState {
  emergency: boolean;
  velocity: number;
  heading_override: number | null;
  description: string;
}

export interface StrategyState {
  has_action: boolean;
  target_heading: number | null;
  target_speed: number | null;
  description: string;
}

export interface MapData {
  size: string;
  resolution: string;
  explored_pct: number;
  frontier_count: number;
  frontiers: [number, number][];
  obstacles_sample: [number, number][];
  terrain_zones: Record<string, number>;
}

export interface RobotState {
  sensors: SensorData;
  reflex: ReflexState;
  strategy: StrategyState;
  map: MapData;
  step: number;
  claude_calls: number;
  mode: "autonomous" | "manual";
}

export interface StateMessage {
  type: "state";
  data: RobotState;
  timestamp: number;
}

export interface CommandResultMessage {
  type: "command_result";
  data: {
    fn: string;
    result: "executed" | "queued" | "overridden" | "ignored" | "error";
    reason?: string;
  };
}

export type WSMessage = StateMessage | CommandResultMessage;
