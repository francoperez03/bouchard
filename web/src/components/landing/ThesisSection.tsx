import { ArrowUpRight } from "lucide-react";
import { SectionBadge } from "./SectionBadge";

export function ThesisSection() {
  return (
    <section id="tesis" className="px-6 py-24 md:px-16 lg:px-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <SectionBadge label="La Tesis" />
          <h2 className="mt-6 font-heading text-4xl italic tracking-tight leading-[0.9] text-white md:text-5xl">
            No deambula. Explora con proposito.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="liquid-glass rounded-2xl p-8">
            <p className="font-body text-sm font-light italic leading-relaxed text-white/80">
              "Claude navega &gt;30% mejor que heuristicas simples cuando tiene
              un mapa parcial y arenas complejas."
            </p>
            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="font-body text-sm font-medium text-white">
                Hipotesis central
              </div>
              <div className="font-body text-xs font-light text-white/50">
                Validacion pendiente con benchmark
              </div>
            </div>
          </div>

          <div className="liquid-glass rounded-2xl p-8">
            <p className="font-body text-sm font-light italic leading-relaxed text-white/80">
              "Sin el mapa, la IA solo reacciona. Con el mapa, se convierte en
              estratega — elige fronteras de alto valor y planifica secuencias
              multi-paso."
            </p>
            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="font-body text-sm font-medium text-white">
                El mapa como diferenciador
              </div>
              <div className="font-body text-xs font-light text-white/50">
                Occupancy grid + fronteras
              </div>
            </div>
          </div>

          <div className="liquid-glass rounded-2xl p-8">
            <p className="font-body text-sm font-light italic leading-relaxed text-white/80">
              "La capa reflexiva garantiza seguridad; la capa estrategica
              optimiza exploracion. Juntas, superan a cualquiera de las dos por
              separado."
            </p>
            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="font-body text-sm font-medium text-white">
                Arquitectura hibrida
              </div>
              <div className="font-body text-xs font-light text-white/50">
                Reflejos + estrategia
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <a
            href="/status"
            className="liquid-glass-strong inline-flex items-center gap-2 rounded-full px-6 py-3 font-body text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Ver en accion
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
