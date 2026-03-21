import { SectionBadge } from "./SectionBadge";

const TERRENOS = [
  {
    name: "Metal",
    color: "#94a3b8",
    friction: "Baja",
    speed: "60%",
    description: "Superficie lisa, traccion alta. Velocidad maxima del robot.",
  },
  {
    name: "Arena",
    color: "#eab308",
    friction: "Variable",
    speed: "30%",
    description:
      "Deslizamiento alto. Compensacion de slip activa, velocidad reducida.",
  },
  {
    name: "Carpet",
    color: "#a78bfa",
    friction: "Alta",
    speed: "50%",
    description: "Traccion estable. Navegacion predecible y segura.",
  },
  {
    name: "Rough",
    color: "#ef4444",
    friction: "Irregular",
    speed: "40%",
    description:
      "Vibracion alta detectada por acelerometro. Monitoreo de estabilidad.",
  },
  {
    name: "Rampa",
    color: "#22c55e",
    friction: "Media",
    speed: "35%",
    description:
      "Inclinacion detectada via eje Z del acelerometro. Ajuste de potencia.",
  },
];

export function TerrenosSection() {
  return (
    <section id="terrenos" className="px-6 py-24 md:px-16 lg:px-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <SectionBadge label="Terrenos" />
          <h2 className="mt-6 font-heading text-4xl italic tracking-tight leading-[0.9] text-white md:text-5xl">
            Cinco superficies. Adaptacion total.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TERRENOS.map((t) => (
            <div key={t.name} className="liquid-glass rounded-2xl p-6">
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{
                    background: t.color,
                    boxShadow: `0 0 8px ${t.color}`,
                  }}
                />
                <h3 className="font-heading text-xl italic text-white">
                  {t.name}
                </h3>
              </div>
              <p className="font-body text-sm font-light leading-relaxed text-white/60">
                {t.description}
              </p>
              <div className="mt-4 flex gap-4 font-body text-xs text-white/40">
                <span>Friccion: {t.friction}</span>
                <span>Vel: {t.speed}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
