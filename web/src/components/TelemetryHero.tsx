import type { RobotState } from "../types/robot";

interface Props {
  state: RobotState;
}

export function TelemetryHero({ state }: Props) {
  const { sensors, map, step, claude_calls } = state;
  const heading = ((sensors.pose.theta * 180) / Math.PI).toFixed(1);
  const velocity = sensors.avance_real.toFixed(1);
  // Energy approximation: inverse of explored % remaining (simulated)
  const energyPct = Math.max(0, Math.min(100, 100 - map.explored_pct * 0.15));

  return (
    <div className="liquid-glass rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg italic text-white">Telemetry</h3>
        <div className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_6px_#22c55e]" />
      </div>

      {/* Hero values */}
      <div className="mt-4 grid grid-cols-2 gap-6">
        <div>
          <div className="font-body text-xs text-white/40">Velocity</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-heading text-4xl italic text-white">{velocity}</span>
            <span className="font-body text-sm text-white/40">m/s</span>
          </div>
        </div>
        <div>
          <div className="font-body text-xs text-white/40">Heading</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-heading text-4xl italic text-white">{heading}</span>
            <span className="font-body text-sm text-white/40">°</span>
          </div>
        </div>
      </div>

      {/* Energy cell bar */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <span className="font-body text-xs text-white/40">Energy Cell</span>
          <span className="font-body text-sm font-medium text-white">{energyPct.toFixed(0)}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${energyPct}%`,
              background: energyPct > 30
                ? "linear-gradient(90deg, #22c55e, #4ade80)"
                : energyPct > 15
                  ? "#eab308"
                  : "#ef4444",
              boxShadow: `0 0 8px ${energyPct > 30 ? "#22c55e40" : energyPct > 15 ? "#eab30840" : "#ef444440"}`,
            }}
          />
        </div>
      </div>

      {/* Secondary stats row */}
      <div className="mt-4 flex gap-4 font-body text-xs text-white/40">
        <span>step: <span className="text-white/60">{step}</span></span>
        <span>explored: <span className="text-white/60">{map.explored_pct.toFixed(1)}%</span></span>
        <span>claude: <span className="text-white/60">{claude_calls}/200</span></span>
        <span>slip: <span className="text-white/60">{(sensors.slip_ratio * 100).toFixed(0)}%</span></span>
      </div>
    </div>
  );
}
