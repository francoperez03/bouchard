import { useCommands } from "../hooks/useCommands";

interface Props {
  mode: "autonomous" | "manual";
}

export function ModeSwitch({ mode }: Props) {
  const { sendCommand } = useCommands();
  const isManual = mode === "manual";

  const toggle = () => {
    sendCommand({
      fn: "set_mode",
      args: { mode: isManual ? "autonomous" : "manual" },
    });
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 13, color: isManual ? "#475569" : "#93c5fd" }}>Auto</span>
      <button
        onClick={toggle}
        style={{
          width: 48,
          height: 26,
          borderRadius: 13,
          border: "none",
          background: isManual ? "#854d0e" : "#1e3a5f",
          cursor: "pointer",
          position: "relative",
          transition: "background 0.2s",
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: isManual ? "#fde047" : "#93c5fd",
            position: "absolute",
            top: 3,
            left: isManual ? 25 : 3,
            transition: "left 0.2s",
          }}
        />
      </button>
      <span style={{ fontSize: 13, color: isManual ? "#fde047" : "#475569" }}>Manual</span>
    </div>
  );
}
