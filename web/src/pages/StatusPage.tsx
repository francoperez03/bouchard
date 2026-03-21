import { useRobotState } from "../hooks/useRobotState";
import { useEventFeed } from "../hooks/useEventFeed";
import { useConnection } from "../contexts/ConnectionContext";
import { SensorPanel } from "../components/SensorPanel";
import { IMUPanel } from "../components/IMUPanel";
import { UnifiedMap } from "../components/UnifiedMap";
import { LayerStatus } from "../components/LayerStatus";
import { MetricsBar } from "../components/MetricsBar";
import { EventFeed } from "../components/EventFeed";
import { TerrainZones } from "../components/TerrainZones";

export function StatusPage() {
  const { connected } = useConnection();
  const { state, poseTrail } = useRobotState();
  const events = useEventFeed(state);

  if (!connected || !state) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <h2 className="font-heading text-3xl italic text-white">Status</h2>
        <p className="mt-4 font-body text-sm text-white/60">
          Waiting for robot connection...
        </p>
        <p className="mt-2 font-body text-xs text-white/40">
          Make sure the robot is running in Webots and the API server
          is active on port 8765.
        </p>
      </div>
    );
  }

  return (
    <div>
      <MetricsBar state={state} />

      {/* Full-width unified map */}
      <div className="mt-6">
        <UnifiedMap
          map={state.map}
          pose={state.sensors.pose}
          trail={poseTrail}
        />
      </div>

      {/* Three-column panel row */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6">
          <SensorPanel sensors={state.sensors} />
          <IMUPanel sensors={state.sensors} />
        </div>

        <div className="flex flex-col gap-6">
          <LayerStatus
            reflex={state.reflex}
            strategy={state.strategy}
            claudeCalls={state.claude_calls}
          />
          <TerrainZones terrainZones={state.map.terrain_zones} />
        </div>

        <EventFeed events={events} />
      </div>
    </div>
  );
}
