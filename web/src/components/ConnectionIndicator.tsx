import { useConnection } from "../contexts/ConnectionContext";

export function ConnectionIndicator() {
  const { connected } = useConnection();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: connected ? "#22c55e" : "#ef4444",
          boxShadow: connected ? "0 0 6px #22c55e" : "0 0 6px #ef4444",
        }}
      />
      <span style={{ fontSize: 13, color: "#94a3b8" }}>
        {connected ? "Conectado" : "Desconectado - robot no activo"}
      </span>
    </div>
  );
}
