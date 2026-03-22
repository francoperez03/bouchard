import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
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
        setToast({ text: res.reason || "Ignored (autonomous mode)", color: "#94a3b8" });
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
        case "m": sendCommand({ fn: "set_mode", args: { mode: disabled ? "manual" : "autonomous" } }); break;
      }
    },
    [disabled, speed, cmd, sendCommand]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const btnBase = "flex h-14 w-14 items-center justify-center rounded-xl text-xl transition-colors";

  return (
    <div className="liquid-glass rounded-2xl p-6">
      <h3 className="font-heading text-lg italic text-white">Control Override</h3>

      <div className="mt-4 flex gap-6">
        {/* Compass joystick */}
        <div className="relative">
          {/* Compass labels */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 font-body text-[10px] text-white/30">N</div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 font-body text-[10px] text-white/30">S</div>
          <div className="absolute top-1/2 -left-4 -translate-y-1/2 font-body text-[10px] text-white/30">W</div>
          <div className="absolute top-1/2 -right-4 -translate-y-1/2 font-body text-[10px] text-white/30">E</div>

          <div className="grid grid-cols-3 gap-1">
            <div />
            <button
              className={cn(btnBase, disabled ? "cursor-not-allowed bg-white/5 text-white/20" : "liquid-glass-strong cursor-pointer text-white hover:bg-white/10")}
              disabled={disabled}
              onClick={() => cmd("avanzar", { velocidad: speed })}
              title="Forward (W)"
            >
              &uarr;
            </button>
            <div />
            <button
              className={cn(btnBase, disabled ? "cursor-not-allowed bg-white/5 text-white/20" : "liquid-glass-strong cursor-pointer text-white hover:bg-white/10")}
              disabled={disabled}
              onClick={() => cmd("girar", { grados: -45, velocidad: speed })}
              title="Turn left (A)"
            >
              &larr;
            </button>
            <button
              className={cn(btnBase, disabled ? "cursor-not-allowed bg-white/5 text-white/20" : "cursor-pointer bg-blue-900/40 text-blue-400 ring-1 ring-blue-500/50 hover:bg-blue-900/60")}
              disabled={disabled}
              onClick={() => cmd("frenar")}
              title="Brake (Space)"
            >
              &#9679;
            </button>
            <button
              className={cn(btnBase, disabled ? "cursor-not-allowed bg-white/5 text-white/20" : "liquid-glass-strong cursor-pointer text-white hover:bg-white/10")}
              disabled={disabled}
              onClick={() => cmd("girar", { grados: 45, velocidad: speed })}
              title="Turn right (D)"
            >
              &rarr;
            </button>
            <div />
            <button
              className={cn(btnBase, disabled ? "cursor-not-allowed bg-white/5 text-white/20" : "liquid-glass-strong cursor-pointer text-white hover:bg-white/10")}
              disabled={disabled}
              onClick={() => cmd("retroceder", { velocidad: speed })}
              title="Reverse (S)"
            >
              &darr;
            </button>
            <div />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-1 flex-col gap-2">
          <button
            className={cn(
              "liquid-glass-strong flex-1 rounded-xl px-4 py-3 font-body text-sm font-medium transition-colors",
              disabled
                ? "cursor-not-allowed text-white/20"
                : "cursor-pointer text-white hover:bg-white/10"
            )}
            disabled={disabled}
            onClick={() => sendCommand({ fn: "set_mode", args: { mode: "manual" } })}
          >
            Take Control
          </button>
          <button
            className={cn(
              "rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 font-body text-sm font-medium transition-colors",
              disabled
                ? "cursor-not-allowed text-white/20 border-white/10 bg-transparent"
                : "cursor-pointer text-blue-300 hover:bg-blue-500/20"
            )}
            disabled={disabled}
            onClick={() => sendCommand({ fn: "set_mode", args: { mode: "autonomous" } })}
          >
            Auto Return
          </button>

          {/* Brake / Torque indicators */}
          <div className="mt-1 flex gap-3">
            <div className="flex items-center gap-2">
              <span className="font-body text-xs text-white/40">Brake</span>
              <span className="font-body text-xs font-medium text-red-400">
                {disabled ? "—" : "OFF"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-body text-xs text-white/40">Torque</span>
              <span className="font-body text-xs font-medium text-green-400">
                {disabled ? "—" : "MAX"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Speed slider */}
      <div className="mt-4 flex items-center gap-3">
        <label className="font-body text-xs text-white/40">Speed:</label>
        <input
          type="range"
          min={0}
          max={100}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          disabled={disabled}
          className="flex-1 accent-white"
        />
        <span className="min-w-[30px] font-body text-sm text-white/80">{speed}</span>
      </div>

      {/* Keyboard hint */}
      <div className="mt-3 font-body text-xs text-white/30">
        WASD / Arrows + Space = brake · M = toggle mode
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="liquid-glass mt-3 rounded-xl px-3 py-2 font-body text-xs"
          style={{ color: toast.color }}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
