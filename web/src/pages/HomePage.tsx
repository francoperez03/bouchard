import { ConnectionIndicator } from "../components/ConnectionIndicator";

export function HomePage() {
  return (
    <div>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Bouchard</h1>
      <p style={{ color: "#94a3b8", marginTop: 0, marginBottom: 20 }}>
        Robot autonomo con IA estrategica para navegacion de terrenos variados
      </p>
      <ConnectionIndicator />

      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Arquitectura</h2>
        <div
          style={{
            background: "#1e293b",
            borderRadius: 8,
            padding: 20,
            fontFamily: "monospace",
            fontSize: 13,
            lineHeight: 1.8,
            color: "#e2e8f0",
            overflowX: "auto",
          }}
        >
          <pre style={{ margin: 0 }}>{`Sensores (8 IR + IMU + odometria)
    |
    v
+-------------------+     +---------------------+
| Capa Reflexiva    |     | Capa Estrategica    |
| (cada step, 32ms) |     | (periodica, Claude) |
| - Obstaculos      |     | - Mapa de ocupacion |
| - Terreno         |     | - Fronteras         |
| - Emergencias     |     | - Objetivos         |
+-------------------+     +---------------------+
    |                           |
    |   reflexes > strategy     |
    v                           v
+-------------------------------+
|         Motores               |
|   (diferencial, e-puck)      |
+-------------------------------+`}</pre>
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Tesis</h2>
        <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
          Claude navega {">"}30% mejor que heuristicas simples cuando tiene un mapa
          parcial y arenas complejas. La capa reflexiva garantiza seguridad;
          la capa estrategica (IA) optimiza exploracion.
        </p>
      </div>
    </div>
  );
}
