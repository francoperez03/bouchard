import { cn } from "@/lib/utils";
import type { ReflexState, StrategyState } from "../types/robot";

interface Props {
  reflex: ReflexState;
  strategy: StrategyState;
  claudeCalls: number;
  maxCalls?: number;
}

export function LayerStatus({ reflex, strategy, claudeCalls, maxCalls = 200 }: Props) {
  return (
    <div className="liquid-glass rounded-2xl p-6">
      <h3 className="font-heading text-lg italic text-white">Layers</h3>

      {/* Reflex Layer */}
      <div
        className={cn(
          "mt-4 rounded-xl p-4",
          reflex.emergency
            ? "bg-red-900/40 ring-1 ring-red-500/50 animate-pulse"
            : "liquid-glass"
        )}
      >
        <div className="font-body text-xs text-white/40">Reflex</div>
        <div className="mt-1 font-body text-sm text-white/80">
          {reflex.description || "idle"}
        </div>
        <div className="mt-2 font-body text-xs text-white/40">
          vel: {reflex.velocity} | emergency: {reflex.emergency ? "YES" : "no"}
          {reflex.heading_override != null && ` | override: ${reflex.heading_override}deg`}
        </div>
      </div>

      {/* Strategy Layer */}
      <div className="liquid-glass mt-3 rounded-xl p-4">
        <div className="font-body text-xs text-white/40">Strategy</div>
        <div className="mt-1 font-body text-sm text-white/80">
          {strategy.description || "idle"}
        </div>
        <div className="mt-2 font-body text-xs text-white/40">
          active: {strategy.has_action ? "yes" : "no"} | Claude calls: {claudeCalls}/{maxCalls}
        </div>
      </div>
    </div>
  );
}
