import { ArrowUpRight } from "lucide-react";

const NAV_LINKS = [
  { label: "Inicio", href: "#inicio" },
  { label: "Capacidades", href: "#capacidades" },
  { label: "Arquitectura", href: "#arquitectura" },
  { label: "Terrenos", href: "#terrenos" },
  { label: "Tesis", href: "#tesis" },
];

export function LandingNav() {
  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 font-heading text-2xl italic text-white">
            B
          </div>
        </div>

        <nav className="liquid-glass flex items-center gap-1 rounded-full px-2 py-2">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-full px-4 py-2 font-body text-sm font-medium text-white/90 transition-colors hover:bg-white/5"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/status"
            className="ml-1 flex items-center gap-1.5 rounded-full bg-white px-4 py-2 font-body text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            Dashboard
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </nav>

        <div className="w-12" />
      </div>
    </header>
  );
}
