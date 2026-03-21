import { Radar, Map, Mountain, Brain } from "lucide-react";
import { SectionBadge } from "./SectionBadge";

const FEATURES = [
  {
    icon: Radar,
    title: "360° Sensors",
    description:
      "8 infrared in a ring, accelerometer, gyroscope, and encoders. Full environment detection every step.",
  },
  {
    icon: Map,
    title: "Real-Time Map",
    description:
      "5cm resolution occupancy grid. Ray-casting from each sensor marks cells as free, occupied, or frontier.",
  },
  {
    icon: Mountain,
    title: "Terrain Classification",
    description:
      "Metal, sand, carpet, rough, ramps. The robot identifies the surface and adapts speed and traction automatically.",
  },
  {
    icon: Brain,
    title: "Strategic AI",
    description:
      "Claude analyzes the partial map and picks exploration frontiers. Thinks at a strategic level, not motor level.",
  },
];

export function CapabilitiesGrid() {
  return (
    <section className="px-6 py-24 md:px-16 lg:px-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <SectionBadge label="Capabilities" />
          <h2 className="mt-6 font-heading text-4xl italic tracking-tight leading-[0.9] text-white md:text-5xl">
            Everything it needs to explore.
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
