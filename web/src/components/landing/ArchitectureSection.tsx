import { SectionBadge } from "./SectionBadge";

const DIAGRAM = `Sensors (8 IR + IMU + odometry)
    |
    v
+-------------------+     +---------------------+
| Reflex Layer      |     | Strategy Layer      |
| (every step, 32ms)|     | (periodic, Claude)  |
| - Obstacles       |     | - Occupancy map     |
| - Terrain         |     | - Frontiers         |
| - Emergencies     |     | - Goals             |
+-------------------+     +---------------------+
    |                           |
    |   reflexes > strategy     |
    v                           v
+-------------------------------+
|          Motors               |
|    (differential, e-puck)    |
+-------------------------------+`;

export function ArchitectureSection() {
  return (
    <section
      id="arquitectura"
      className="relative flex min-h-[700px] items-center justify-center overflow-hidden px-6 py-32 md:px-16 lg:px-24"
    >
      {/* Subtle bg glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-white/[0.015] blur-[100px]" />
      </div>

      <div className="relative z-10 flex max-w-3xl flex-col items-center text-center">
        <SectionBadge label="Architecture" />

        <h2 className="mt-6 font-heading text-4xl italic tracking-tight leading-[0.9] text-white md:text-5xl lg:text-6xl">
          Two layers. One brain.
        </h2>

        <p className="mt-6 max-w-lg font-body text-sm font-light leading-relaxed text-white/60">
          The reflex layer guarantees safety every step. The strategy layer
          optimizes exploration with artificial intelligence. When in conflict,
          reflexes always win.
        </p>

        <div className="liquid-glass mt-10 w-full rounded-2xl p-8">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-white/70 sm:text-sm">
            {DIAGRAM}
          </pre>
        </div>
      </div>
    </section>
  );
}
