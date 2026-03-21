import { Radar, Map, Mountain, Brain } from "lucide-react";
import { SectionBadge } from "./SectionBadge";

const FEATURES = [
  {
    icon: Radar,
    title: "Sensores 360°",
    description:
      "8 infrarrojos en anillo, acelerometro, giroscopio y encoders. Deteccion completa del entorno a cada step.",
  },
  {
    icon: Map,
    title: "Mapa en Tiempo Real",
    description:
      "Occupancy grid de 5cm de resolucion. Ray-casting desde cada sensor marca celdas libres, ocupadas, y fronteras.",
  },
  {
    icon: Mountain,
    title: "Clasificacion de Terreno",
    description:
      "Metal, arena, carpet, rough, rampas. El robot identifica el suelo y adapta velocidad y traccion automaticamente.",
  },
  {
    icon: Brain,
    title: "IA Estrategica",
    description:
      "Claude analiza el mapa parcial y elige fronteras de exploracion. Piensa a nivel estrategico, no a nivel motor.",
  },
];

export function CapabilitiesGrid() {
  return (
    <section className="px-6 py-24 md:px-16 lg:px-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <SectionBadge label="Capacidades" />
          <h2 className="mt-6 font-heading text-4xl italic tracking-tight leading-[0.9] text-white md:text-5xl">
            Todo lo que necesita para explorar.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="liquid-glass space-y-4 rounded-2xl p-6"
            >
              <div className="liquid-glass-strong flex h-10 w-10 items-center justify-center rounded-full">
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-heading text-lg italic text-white">
                {feature.title}
              </h3>
              <p className="font-body text-sm font-light text-white/60">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
