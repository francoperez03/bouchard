import type { ReflexState, StrategyState } from "../types/robot";

interface Props {
  reflex: ReflexState;
  strategy: StrategyState;
  claudeCalls: number;
  maxCalls?: number;
}

export function LayerStatus({ reflex, strategy, claudeCalls, maxCalls = 200 }: Props) {
  return (
    <div>
      <h3 style={{ fontSize: 14, marginBottom: 8, color: "#94a3b8" }}>Capas</h3>

      {/* Reflex Layer */}
      <div
        style={{
          padding: 10,
          borderRadius: 6,
          marginBottom: 8,
          background: reflex.emergency ? "#7f1d1d" : "#1e293b",
          border: `1px solid ${reflex.emergency ? "#ef4444" : "#334155"}`,
          animation: reflex.emergency ? "pulse 1s infinite" : undefined,
        }}
      >
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Reflex</div>
        <div style={{ fontSize: 13, color: "#e2e8f0" }}>{reflex.description || "idle"}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
          vel: {reflex.velocity} | emergency: {reflex.emergency ? "SI" : "no"}
          {reflex.heading_override != null && ` | override: ${reflex.heading_override}deg`}
        </div>
      </div>

      {/* Strategy Layer */}
      <div
        style={{
          padding: 10,
          borderRadius: 6,
          background: "#1e293b",
          border: "1px solid #334155",
        }}
      >
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Strategy</div>
        <div style={{ fontSize: 13, color: "#e2e8f0" }}>{strategy.description || "idle"}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
          activo: {strategy.has_action ? "si" : "no"} | Claude calls: {claudeCalls}/{maxCalls}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
