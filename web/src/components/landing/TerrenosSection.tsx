import { SectionBadge } from "./SectionBadge";

const TERRENOS = [
  {
    name: "Metal",
    color: "#94a3b8",
    friction: "Low",
    speed: "60%",
    description: "Smooth surface, high traction. Maximum robot speed.",
  },
  {
    name: "Sand",
    color: "#eab308",
    friction: "Variable",
    speed: "30%",
    description:
      "High slip. Active slip compensation, reduced speed.",
  },
  {
    name: "Carpet",
    color: "#a78bfa",
    friction: "High",
    speed: "50%",
    description: "Stable traction. Predictable and safe navigation.",
  },
  {
    name: "Rough",
    color: "#ef4444",
    friction: "Irregular",
    speed: "40%",
    description:
      "High vibration detected by accelerometer. Stability monitoring.",
  },
  {
    name: "Ramp",
    color: "#22c55e",
    friction: "Medium",
    speed: "35%",
    description:
      "Tilt detected via accelerometer Z-axis. Power adjustment.",
  },
];

export function TerrenosSection() {
  return (
    <section id="terrenos" className="px-6 py-24 md:px-16 lg:px-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <SectionBadge label="Terrains" />
          <h2 className="mt-6 font-heading text-4xl italic tracking-tight leading-[0.9] text-white md:text-5xl">
            Five surfaces. Total adaptation.
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
                <span>Friction: {t.friction}</span>
                <span>Speed: {t.speed}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
