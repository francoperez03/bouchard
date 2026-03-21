import { ConnectionIndicator } from "../components/ConnectionIndicator";

const card = {
  background: "#1e293b",
  borderRadius: 8,
  padding: 20,
} as const;

const monoBox = {
  ...card,
  fontFamily: "monospace",
  fontSize: 13,
  lineHeight: 1.8,
  color: "#e2e8f0",
  overflowX: "auto" as const,
};

const h2Style = { fontSize: 18, marginBottom: 12 } as const;
const bodyText = { color: "#cbd5e1", lineHeight: 1.6, margin: 0 } as const;

export function HomePage() {
  return (
    <div style={{ maxWidth: 820 }}>
      {/* ── Hero ── */}
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Bouchard</h1>
      <p style={{ color: "#94a3b8", marginTop: 0, marginBottom: 8 }}>
        Robot autonomo con IA estrategica para navegacion de terrenos variados
      </p>
      <p style={{ color: "#64748b", marginTop: 0, marginBottom: 20, fontSize: 13, fontStyle: "italic" }}>
        Nombrado en honor a Hipolito Bouchard, corsario argentino que navegaba
        terreno hostil con estrategia y audacia.
      </p>
      <ConnectionIndicator />

      {/* ── El Corsario ── */}
      <div style={{ marginTop: 32 }}>
        <h2 style={h2Style}>El Corsario</h2>
        <div style={card}>
          <p style={bodyText}>
            En el siglo XIX, Hipolito Bouchard zarpo desde Buenos Aires con una
            mision imposible: circunnavegar el globo atacando posiciones enemigas
            con una fragata mal pertrechada y una tripulacion improvisada.
            Lo que le faltaba en recursos lo compensaba con estrategia — elegia
            sus batallas, adaptaba sus tacticas al terreno y nunca dejaba de
            avanzar.
          </p>
          <p style={{ ...bodyText, marginTop: 12 }}>
            Este robot lleva su nombre porque enfrenta el mismo desafio:
            explorar un terreno desconocido y hostil con recursos limitados.
            Ocho sensores infrarrojos, dos ruedas, y una IA que piensa
            estrategicamente. Como el corsario, no navega a ciegas — construye
            un mapa, identifica fronteras inexploradas, y elige la ruta mas
            inteligente.
          </p>
        </div>
      </div>

      {/* ── Capacidades ── */}
      <div style={{ marginTop: 32 }}>
        <h2 style={h2Style}>Capacidades</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={card}>
            <div style={{ fontSize: 13, color: "#22c55e", fontFamily: "monospace", marginBottom: 6 }}>
              {"[8x IR 360°]"}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Sensores de Proximidad</div>
            <p style={{ ...bodyText, fontSize: 13 }}>
              8 sensores infrarrojos en anillo, acelerometro, giroscopio y
              encoders en las ruedas. Deteccion de obstaculos, vibracion,
              inclinacion y deslizamiento.
            </p>
          </div>
          <div style={card}>
            <div style={{ fontSize: 13, color: "#3b82f6", fontFamily: "monospace", marginBottom: 6 }}>
              {"[MAP 5cm/cell]"}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Mapa en Tiempo Real</div>
            <p style={{ ...bodyText, fontSize: 13 }}>
              Construye un occupancy grid con resolucion de 5cm usando
              ray-casting desde los 8 sensores. Libre, ocupado, o
              desconocido — con fronteras de exploracion marcadas.
            </p>
          </div>
          <div style={card}>
            <div style={{ fontSize: 13, color: "#eab308", fontFamily: "monospace", marginBottom: 6 }}>
              {"[TERRAIN ID]"}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Clasificacion de Terreno</div>
            <p style={{ ...bodyText, fontSize: 13 }}>
              Detecta automaticamente metal, arena, carpet, rough y rampas.
              Ajusta velocidad y traccion en tiempo real — frena en arena,
              acelera en metal, compensa deslizamiento.
            </p>
          </div>
          <div style={card}>
            <div style={{ fontSize: 13, color: "#ef4444", fontFamily: "monospace", marginBottom: 6 }}>
              {"[CLAUDE AI]"}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>IA Estrategica</div>
            <p style={{ ...bodyText, fontSize: 13 }}>
              Claude analiza el mapa parcial y decide que fronteras explorar.
              No controla motores — piensa a nivel estrategico. El robot
              ejecuta, la IA planifica.
            </p>
          </div>
        </div>
      </div>

      {/* ── Arquitectura ── */}
      <div style={{ marginTop: 32 }}>
        <h2 style={h2Style}>Arquitectura</h2>
        <div style={monoBox}>
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
        <p style={{ ...bodyText, marginTop: 12 }}>
          Dos capas de inteligencia trabajan en paralelo. La{" "}
          <span style={{ color: "#22c55e" }}>capa reflexiva</span> corre cada
          32ms — evita obstaculos, detecta terreno y frena en emergencias. La{" "}
          <span style={{ color: "#3b82f6" }}>capa estrategica</span> consulta a
          Claude periodicamente para decidir hacia donde explorar. En caso de
          conflicto, los reflejos siempre ganan.
        </p>
      </div>

      {/* ── Terrenos ── */}
      <div style={{ marginTop: 32 }}>
        <h2 style={h2Style}>Terrenos</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { name: "Metal", color: "#94a3b8", desc: "Baja friccion, alta traccion. Velocidad maxima." },
            { name: "Arena", color: "#eab308", desc: "Deslizamiento alto. Velocidad reducida al 30%, compensacion de slip." },
            { name: "Carpet", color: "#a78bfa", desc: "Friccion moderada-alta. Navegacion estable." },
            { name: "Rough", color: "#ef4444", desc: "Vibracion alta. Velocidad reducida, monitoreo de estabilidad." },
            { name: "Rampa", color: "#22c55e", desc: "Inclinacion detectada via acelerometro. Ajuste de potencia por gravedad." },
          ].map((t) => (
            <div
              key={t.name}
              style={{
                ...card,
                padding: "12px 20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: t.color,
                  boxShadow: `0 0 6px ${t.color}`,
                  flexShrink: 0,
                }}
              />
              <div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</span>
                <span style={{ color: "#94a3b8", fontSize: 13, marginLeft: 12 }}>{t.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Control Dual ── */}
      <div style={{ marginTop: 32 }}>
        <h2 style={h2Style}>Control Dual</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ ...card, borderLeft: "3px solid #3b82f6" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#93c5fd", marginBottom: 8 }}>
              Modo Autonomo
            </div>
            <p style={{ ...bodyText, fontSize: 13 }}>
              Claude analiza el mapa y define objetivos de exploracion.
              La capa reflexiva ejecuta la navegacion paso a paso. El robot
              construye su propio plan, aprende de los resultados, y ajusta
              la estrategia en cada ciclo.
            </p>
          </div>
          <div style={{ ...card, borderLeft: "3px solid #eab308" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#fde047", marginBottom: 8 }}>
              Modo Manual
            </div>
            <p style={{ ...bodyText, fontSize: 13 }}>
              Control remoto via dashboard web. Comandos directos de
              movimiento con D-pad y velocidad ajustable. Los reflejos de
              seguridad siguen activos — si hay un obstaculo, el robot
              frena aunque le ordenes avanzar.
            </p>
          </div>
        </div>
      </div>

      {/* ── Tesis ── */}
      <div style={{ marginTop: 32, marginBottom: 48 }}>
        <h2 style={h2Style}>La Tesis</h2>
        <div style={{ ...card, borderLeft: "3px solid #22c55e" }}>
          <p style={{ ...bodyText, fontSize: 15 }}>
            "Claude navega {">"}30% mejor que heuristicas simples cuando tiene
            un mapa parcial y arenas complejas."
          </p>
          <p style={{ ...bodyText, fontSize: 13, marginTop: 12, color: "#94a3b8" }}>
            Sin el mapa, la IA solo puede reaccionar a lo inmediato. Con el
            mapa, se convierte en estratega — elige fronteras de alto valor,
            evita zonas ya mapeadas, y planifica secuencias de exploracion
            multi-paso. La diferencia entre un robot que deambula y uno que
            explora con proposito.
          </p>
        </div>
      </div>
    </div>
  );
}
