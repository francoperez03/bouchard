const STATS = [
  { value: "8", label: "IR Sensors" },
  { value: "5cm", label: "Map Resolution" },
  { value: "32ms", label: "Reflex Cycle" },
  { value: "2", label: "AI Layers" },
];

export function StatsSection() {
  return (
    <section className="relative overflow-hidden px-6 py-24 md:px-16 lg:px-24">
      {/* Subtle background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-white/[0.01] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="liquid-glass grid grid-cols-2 gap-8 rounded-3xl p-12 text-center md:p-16 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="font-heading text-4xl italic text-white md:text-5xl lg:text-6xl">
                {stat.value}
              </div>
              <div className="mt-2 font-body text-sm font-light text-white/60">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
