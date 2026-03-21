import { SectionBadge } from "./SectionBadge";

const ROWS = [
  {
    title: "Reflexes at 32ms. Pure instinct.",
    description:
      "The reflex layer runs every simulation step. Detects obstacles with 8 IR sensors, classifies terrain by vibration and traction, and brakes on emergencies. It doesn't wait. It doesn't think. It reacts.",
    detail: `Obstacles → immediate evasion
Sand terrain → speed at 30%
Tilt → gravity compensation
Slip > 0.3 → power reduction
Danger → emergency brake`,
    reverse: false,
  },
  {
    title: "AI that thinks, not reacts.",
    description:
      "The strategy layer queries Claude periodically. Analyzes the occupancy map, identifies unexplored frontiers, and decides where to go. It doesn't control motors — it plans routes. The robot executes, the AI directs.",
    detail: `set_exploration_target(x, y)
backtrack() → return to safe zone
patrol_area(x1, y1, x2, y2)
investigate(x, y) → point of interest
Response cache (TTL: 500 steps)`,
    reverse: true,
  },
];

export function CapabilitiesChess() {
  return (
    <section id="capacidades" className="px-6 py-24 md:px-16 lg:px-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <SectionBadge label="Two Layers" />
          <h2 className="mt-6 font-heading text-4xl italic tracking-tight leading-[0.9] text-white md:text-5xl">
            Fast reflexes. Deep strategy.
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
