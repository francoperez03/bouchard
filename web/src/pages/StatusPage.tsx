import { useRobotState } from "../hooks/useRobotState";
import { useConnection } from "../contexts/ConnectionContext";
import { SensorPanel } from "../components/SensorPanel";
import { PoseDisplay } from "../components/PoseDisplay";
import { MapCanvas } from "../components/MapCanvas";
import { LayerStatus } from "../components/LayerStatus";
import { MetricsBar } from "../components/MetricsBar";

export function StatusPage() {
  const { connected } = useConnection();
  const { state, poseTrail } = useRobotState();

  if (!connected || !state) {
    return (
      <div style={{ padding: 20, color: "#94a3b8" }}>
        <h2 style={{ fontSize: 20 }}>Status Dashboard</h2>
        <p>Esperando conexion al robot...</p>
        <p style={{ fontSize: 13 }}>
          Asegurate de que el robot este corriendo en Webots y el API server este activo en puerto 8765.
        </p>
      </div>
    );
  }

  return (
    <div>
      <MetricsBar state={state} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginTop: 16,
        }}
      >
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <SensorPanel sensors={state.sensors} />
          <PoseDisplay pose={state.sensors.pose} trail={poseTrail} />
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <MapCanvas map={state.map} pose={state.sensors.pose} />
          <LayerStatus
            reflex={state.reflex}
            strategy={state.strategy}
            claudeCalls={state.claude_calls}
          />
        </div>
      </div>
    </div>
  );
}
