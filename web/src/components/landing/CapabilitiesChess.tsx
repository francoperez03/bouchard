import { SectionBadge } from "./SectionBadge";

const ROWS = [
  {
    title: "Reflejos a 32ms. Instinto puro.",
    description:
      "La capa reflexiva corre cada step de simulacion. Detecta obstaculos con 8 sensores IR, clasifica terreno por vibracion y traccion, y frena en emergencias. No espera. No piensa. Reacciona.",
    detail: `Obstaculos → evasion inmediata
Terreno arena → velocidad al 30%
Inclinacion → compensacion de gravedad
Slip > 0.3 → reduccion de potencia
Peligro → freno de emergencia`,
    reverse: false,
  },
  {
    title: "IA que piensa, no reacciona.",
    description:
      "La capa estrategica consulta a Claude periodicamente. Analiza el mapa de ocupacion, identifica fronteras inexploradas, y decide hacia donde ir. No controla motores — planifica rutas. El robot ejecuta, la IA dirige.",
    detail: `set_exploration_target(x, y)
backtrack() → volver a zona segura
patrol_area(x1, y1, x2, y2)
investigate(x, y) → punto de interes
Cache de respuestas (TTL: 500 steps)`,
    reverse: true,
  },
];

export function CapabilitiesChess() {
  return (
    <section id="capacidades" className="px-6 py-24 md:px-16 lg:px-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <SectionBadge label="Dos Capas" />
          <h2 className="mt-6 font-heading text-4xl italic tracking-tight leading-[0.9] text-white md:text-5xl">
            Reflejos rapidos. Estrategia profunda.
          </h2>
        </div>

        <div className="flex flex-col gap-24">
          {ROWS.map((row, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-12 lg:flex-row ${
                row.reverse ? "lg:flex-row-reverse" : ""
              }`}
            >
              <div className="flex-1 space-y-4">
                <h3 className="font-heading text-3xl italic tracking-tight leading-[0.9] text-white">
                  {row.title}
                </h3>
                <p className="font-body text-sm font-light leading-relaxed text-white/60">
                  {row.description}
                </p>
              </div>

              <div className="liquid-glass flex-1 overflow-hidden rounded-2xl">
                <pre className="p-8 font-mono text-sm leading-relaxed text-white/70">
                  {row.detail}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
