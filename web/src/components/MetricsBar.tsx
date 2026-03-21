import { cn } from "@/lib/utils";
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
    <div className="liquid-glass flex flex-wrap items-center gap-4 rounded-2xl px-5 py-3 font-body text-sm text-white/60">
      <span>step: <b className="text-white">{step}</b></span>
      <span>explored: <b className="text-white">{map.explored_pct.toFixed(1)}%</b></span>
      <span>claude: <b className="text-white">{claude_calls}/200</b></span>
      <span>terrain: <b className="text-white">{TERRAIN_EMOJI[terrain] || "?"} {terrain}</b></span>
      <span>slip: <b className="text-white">{(sensors.slip_ratio * 100).toFixed(0)}%</b></span>
      <span
        className={cn(
          "ml-auto rounded-full px-3 py-1 text-xs font-medium",
          mode === "manual"
            ? "bg-yellow-500/20 text-yellow-300"
            : "bg-blue-500/20 text-blue-300"
        )}
      >
        {mode === "manual" ? "MANUAL" : "AUTO"}
      </span>
    </div>
  );
}
