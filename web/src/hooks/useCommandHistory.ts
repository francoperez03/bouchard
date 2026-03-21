import { useEffect, useRef } from "react";
import type { CommandResultMessage } from "../types/robot";
import type { CommandHistoryEntry } from "../types/events";

const RESULT_COLORS: Record<string, string> = {
  executed: "#22c55e",
  queued: "#22c55e",
  overridden: "#eab308",
  ignored: "#94a3b8",
  error: "#ef4444",
};

export function useCommandHistory(
  lastCommandResult: CommandResultMessage["data"] | null
): CommandHistoryEntry[] {
  const entriesRef = useRef<CommandHistoryEntry[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!lastCommandResult) return;

    entriesRef.current = [
      {
        id: ++idRef.current,
        timestamp: Date.now(),
        command: lastCommandResult.fn,
        result: lastCommandResult.result,
        color: RESULT_COLORS[lastCommandResult.result] || "#94a3b8",
      },
      ...entriesRef.current,
    ].slice(0, 10);
  }, [lastCommandResult]);

  return entriesRef.current;
}
