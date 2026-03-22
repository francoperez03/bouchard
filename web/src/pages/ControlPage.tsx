import { useRobotState } from "../hooks/useRobotState";
import { useCommandHistory } from "../hooks/useCommandHistory";
import { useEventFeed } from "../hooks/useEventFeed";
import { useConnection } from "../contexts/ConnectionContext";
import { CommandPanel } from "../components/CommandPanel";
import { CommandHistory } from "../components/CommandHistory";
import { ModeSwitch } from "../components/ModeSwitch";
import { MetricsBar } from "../components/MetricsBar";
import { UnifiedMap } from "../components/UnifiedMap";
import { SensorMiniOverlay } from "../components/SensorMiniOverlay";
import { EventFeed } from "../components/EventFeed";

export function ControlPage() {
  const { connected } = useConnection();
  const { state, poseTrail, lastCommandResult } = useRobotState();
  const commandHistory = useCommandHistory(lastCommandResult);
  const events = useEventFeed(state);

  if (!connected || !state) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <h2 className="font-heading text-3xl italic text-white">Remote Control</h2>
        <p className="mt-4 font-body text-sm text-white/60">
          Waiting for robot connection...
        </p>
      </div>
    );
  }

  const isManual = state.mode === "manual";

  return (
    <div>
      <MetricsBar state={state} />

      {/* Main grid: controls left, map right */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-6">
          <CommandPanel disabled={!isManual} lastCommandResult={lastCommandResult} />
          <CommandHistory entries={commandHistory} />
        </div>

        <div className="flex flex-col gap-6">
          <UnifiedMap
            map={state.map}
            pose={state.sensors.pose}
            trail={poseTrail}
            overlay={<SensorMiniOverlay sensors={state.sensors} />}
          />
          <EventFeed events={events} />
        </div>
      </div>

      {/* Mode tabs at bottom */}
      <div className="mt-6">
        <ModeSwitch mode={state.mode} />
      </div>

      {!isManual && (
        <div className="liquid-glass mt-4 rounded-2xl border border-blue-500/30 p-4 font-body text-sm text-blue-300">
          Autonomous mode active. Switch to Manual to send commands. The Brake
          button works in both modes.
        </div>
      )}
    </div>
  );
}
