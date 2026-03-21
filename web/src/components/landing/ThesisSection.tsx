import { ArrowUpRight } from "lucide-react";
import { SectionBadge } from "./SectionBadge";

export function ThesisSection() {
  return (
    <section id="tesis" className="px-6 py-24 md:px-16 lg:px-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <SectionBadge label="The Thesis" />
          <h2 className="mt-6 font-heading text-4xl italic tracking-tight leading-[0.9] text-white md:text-5xl">
            It doesn't wander. It explores with purpose.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="liquid-glass rounded-2xl p-8">
            <p className="font-body text-sm font-light italic leading-relaxed text-white/80">
              "Claude navigates &gt;30% better than simple heuristics when it
              has a partial map and complex arenas."
            </p>
            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="font-body text-sm font-medium text-white">
                Core hypothesis
              </div>
              <div className="font-body text-xs font-light text-white/50">
                Pending benchmark validation
              </div>
            </div>
          </div>

          <div className="liquid-glass rounded-2xl p-8">
            <p className="font-body text-sm font-light italic leading-relaxed text-white/80">
              "Without the map, the AI can only react. With the map, it becomes
              a strategist — picks high-value frontiers and plans multi-step
              sequences."
            </p>
            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="font-body text-sm font-medium text-white">
                The map as differentiator
              </div>
              <div className="font-body text-xs font-light text-white/50">
                Occupancy grid + frontiers
              </div>
            </div>
          </div>

          <div className="liquid-glass rounded-2xl p-8">
            <p className="font-body text-sm font-light italic leading-relaxed text-white/80">
              "The reflex layer guarantees safety; the strategy layer optimizes
              exploration. Together, they outperform either one alone."
            </p>
            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="font-body text-sm font-medium text-white">
                Hybrid architecture
              </div>
              <div className="font-body text-xs font-light text-white/50">
                Reflexes + strategy
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="font-heading text-2xl italic tracking-tight text-white/70 md:text-3xl">
            AI navigates the unknown
          </p>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/status"
            className="liquid-glass-strong inline-flex items-center gap-2 rounded-full px-6 py-3 font-body text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            See it in action
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
