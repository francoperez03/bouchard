import { useCallback, useState } from "react";
import type { CommandRequest, CommandResponse } from "../types/commands";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8765";

export function useCommands() {
  const [sending, setSending] = useState(false);

  const sendCommand = useCallback(async (cmd: CommandRequest): Promise<CommandResponse> => {
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cmd),
      });
      return await res.json();
    } catch {
      return { status: "error", message: "No se pudo conectar al servidor" };
    } finally {
      setSending(false);
    }
  }, []);

  return { sendCommand, sending };
}
