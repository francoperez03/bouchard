import type { RobotState } from "../types/robot";

interface Props {
  state: RobotState;
}

const TERRAIN_EMOJI: Record<string, string> = {
  metal: "M",
  carpet: "C",
  sand: "S",
  rough: "R",
  ramp: "^",
};

export function MetricsBar({ state }: Props) {
  const { sensors, map, step, claude_calls, mode } = state;
  const terrain = sensors.terreno_detectado;

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        padding: "8px 12px",
        background: "#1e293b",
        borderRadius: 6,
        fontSize: 13,
        color: "#e2e8f0",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <span>step: <b>{step}</b></span>
      <span>explorado: <b>{map.explored_pct.toFixed(1)}%</b></span>
      <span>claude: <b>{claude_calls}/200</b></span>
      <span>terreno: <b>{TERRAIN_EMOJI[terrain] || "?"} {terrain}</b></span>
      <span>slip: <b>{(sensors.slip_ratio * 100).toFixed(0)}%</b></span>
      <span
        style={{
          marginLeft: "auto",
          padding: "2px 8px",
          borderRadius: 4,
          fontSize: 12,
          background: mode === "manual" ? "#854d0e" : "#1e3a5f",
          color: mode === "manual" ? "#fde047" : "#93c5fd",
        }}
      >
        {mode === "manual" ? "MANUAL" : "AUTO"}
      </span>
    </div>
  );
}
