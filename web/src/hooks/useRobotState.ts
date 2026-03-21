import { useEffect, useRef, useState } from "react";
import { useConnection } from "../contexts/ConnectionContext";
import type { RobotState, Pose, CommandResultMessage } from "../types/robot";

export function useRobotState() {
  const { lastMessage } = useConnection();
  const [state, setState] = useState<RobotState | null>(null);
  const [lastCommandResult, setLastCommandResult] = useState<CommandResultMessage["data"] | null>(null);
  const poseTrailRef = useRef<Pose[]>([]);

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === "state") {
      setState(lastMessage.data);
      const trail = poseTrailRef.current;
      trail.push(lastMessage.data.sensors.pose);
      if (trail.length > 200) trail.shift();
    } else if (lastMessage.type === "command_result") {
      setLastCommandResult(lastMessage.data);
    }
  }, [lastMessage]);

  return { state, poseTrail: poseTrailRef.current, lastCommandResult };
}
