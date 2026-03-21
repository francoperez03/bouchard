import { SectionBadge } from "./SectionBadge";

const DIAGRAM = `Sensores (8 IR + IMU + odometria)
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
        <SectionBadge label="Arquitectura" />

        <h2 className="mt-6 font-heading text-4xl italic tracking-tight leading-[0.9] text-white md:text-5xl lg:text-6xl">
          Dos capas. Un cerebro.
        </h2>

        <p className="mt-6 max-w-lg font-body text-sm font-light leading-relaxed text-white/60">
          La capa reflexiva garantiza seguridad en cada step. La capa
          estrategica optimiza exploracion con inteligencia artificial. En caso
          de conflicto, los reflejos siempre ganan.
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
