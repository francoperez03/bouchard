import { SectionBadge } from "./SectionBadge";

const TECH = ["Webots", "Claude AI", "Python", "React"];

export function TechBar() {
  return (
    <section className="relative z-10 flex flex-col items-center gap-8 bg-black pb-8 pt-16">
      <SectionBadge label="Construido con" />
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
        {TECH.map((name) => (
          <span
            key={name}
            className="font-heading text-2xl italic text-white md:text-3xl"
          >
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}
