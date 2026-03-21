import { useState, useEffect, useCallback } from "react";
import { useCommands } from "../hooks/useCommands";
import type { CommandResultMessage } from "../types/robot";

interface Props {
  disabled: boolean;
  lastCommandResult: CommandResultMessage["data"] | null;
}

export function CommandPanel({ disabled, lastCommandResult }: Props) {
  const { sendCommand } = useCommands();
  const [speed, setSpeed] = useState(50);
  const [toast, setToast] = useState<{ text: string; color: string } | null>(null);

  useEffect(() => {
    if (!lastCommandResult) return;
    const { result, reason } = lastCommandResult;
    if (result === "overridden") {
      setToast({ text: `Safety override: ${reason}`, color: "#eab308" });
    } else if (result === "error") {
      setToast({ text: reason || "Error", color: "#ef4444" });
    }
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [lastCommandResult]);

  const cmd = useCallback(
    async (fn: string, args: Record<string, number | string> = {}) => {
      const res = await sendCommand({ fn: fn as any, args });
      if (res.status === "queued") {
        setToast({ text: "Queued", color: "#22c55e" });
        setTimeout(() => setToast(null), 1500);
      } else if (res.status === "ignored") {
        setToast({ text: res.reason || "Ignorado (modo autonomo)", color: "#94a3b8" });
        setTimeout(() => setToast(null), 2000);
      } else if (res.status === "error") {
        setToast({ text: res.message || "Error", color: "#ef4444" });
        setTimeout(() => setToast(null), 3000);
      }
    },
    [sendCommand]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;
      switch (e.key.toLowerCase()) {
        case "w": case "arrowup":    cmd("avanzar", { velocidad: speed }); break;
        case "s": case "arrowdown":  cmd("retroceder", { velocidad: speed }); break;
        case "a": case "arrowleft":  cmd("girar", { grados: -45, velocidad: speed }); break;
        case "d": case "arrowright": cmd("girar", { grados: 45, velocidad: speed }); break;
        case " ": cmd("frenar"); e.preventDefault(); break;
      }
    },
    [disabled, speed, cmd]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const btnStyle = (color: string) => ({
    width: 56,
    height: 56,
    borderRadius: 8,
    border: "1px solid #475569",
    background: disabled ? "#1e293b" : color,
    color: disabled ? "#475569" : "#fff",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 20,
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  });

  return (
    <div>
      <h3 style={{ fontSize: 14, marginBottom: 8, color: "#94a3b8" }}>Comandos</h3>

      {/* D-pad */}
      <div style={{ display: "grid", gridTemplateColumns: "56px 56px 56px", gap: 4, width: "fit-content" }}>
        <div />
        <button style={btnStyle("#334155")} disabled={disabled} onClick={() => cmd("avanzar", { velocidad: speed })} title="Avanzar (W)">
          &uarr;
        </button>
        <div />
        <button style={btnStyle("#334155")} disabled={disabled} onClick={() => cmd("girar", { grados: -45, velocidad: speed })} title="Girar izq (A)">
          &larr;
        </button>
        <button style={{ ...btnStyle("#991b1b"), borderColor: "#ef4444" }} disabled={disabled} onClick={() => cmd("frenar")} title="Frenar (Space)">
          &#9632;
        </button>
        <button style={btnStyle("#334155")} disabled={disabled} onClick={() => cmd("girar", { grados: 45, velocidad: speed })} title="Girar der (D)">
          &rarr;
        </button>
        <div />
        <button style={btnStyle("#334155")} disabled={disabled} onClick={() => cmd("retroceder", { velocidad: speed })} title="Retroceder (S)">
          &darr;
        </button>
        <div />
      </div>

      {/* Speed slider */}
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <label style={{ fontSize: 12, color: "#94a3b8" }}>Vel:</label>
        <input
          type="range"
          min={0}
          max={100}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          disabled={disabled}
          style={{ flex: 1 }}
        />
        <span style={{ fontSize: 13, color: "#e2e8f0", minWidth: 30 }}>{speed}</span>
      </div>

      {/* Keyboard hint */}
      <div style={{ marginTop: 8, fontSize: 11, color: "#475569" }}>
        WASD / Flechas + Space = frenar
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            marginTop: 8,
            padding: "4px 10px",
            borderRadius: 4,
            fontSize: 12,
            background: "#0f172a",
            color: toast.color,
            border: `1px solid ${toast.color}`,
          }}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
