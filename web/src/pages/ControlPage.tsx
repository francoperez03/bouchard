import { useRobotState } from "../hooks/useRobotState";
import { useConnection } from "../contexts/ConnectionContext";
import { CommandPanel } from "../components/CommandPanel";
import { ModeSwitch } from "../components/ModeSwitch";
import { MetricsBar } from "../components/MetricsBar";
import { MapCanvas } from "../components/MapCanvas";

export function ControlPage() {
  const { connected } = useConnection();
  const { state, lastCommandResult } = useRobotState();

  if (!connected || !state) {
    return (
      <div style={{ padding: 20, color: "#94a3b8" }}>
        <h2 style={{ fontSize: 20 }}>Control Remoto</h2>
        <p>Esperando conexion al robot...</p>
      </div>
    );
  }

  const isManual = state.mode === "manual";

  return (
    <div>
      <MetricsBar state={state} />

      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 16 }}>
        <h2 style={{ fontSize: 18, margin: 0 }}>Control Remoto</h2>
        <ModeSwitch mode={state.mode} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: 24,
          marginTop: 16,
        }}
      >
        <CommandPanel disabled={!isManual} lastCommandResult={lastCommandResult} />
        <MapCanvas map={state.map} pose={state.sensors.pose} />
      </div>

      {!isManual && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 6,
            background: "#1e3a5f",
            border: "1px solid #3b82f6",
            fontSize: 13,
            color: "#93c5fd",
          }}
        >
          Modo autonomo activo. Cambia a Manual para enviar comandos. El boton Frenar funciona en ambos modos.
        </div>
      )}
    </div>
  );
}
