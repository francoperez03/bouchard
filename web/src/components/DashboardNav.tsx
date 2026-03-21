import { NavLink } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useConnection } from "../contexts/ConnectionContext";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Status", to: "/status" },
  { label: "Control", to: "/control" },
];

export function DashboardNav() {
  const { connected } = useConnection();

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <a
          href="/"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 font-heading text-2xl italic text-white transition-opacity hover:opacity-80"
        >
          B
        </a>

        <nav className="liquid-glass flex items-center gap-1 rounded-full px-2 py-2">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-2 font-body text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white/80"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          <a
            href="/"
            className="ml-1 flex items-center gap-1.5 rounded-full bg-white px-4 py-2 font-body text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            Landing
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              connected
                ? "bg-green-500 shadow-[0_0_6px_#22c55e]"
                : "bg-red-500 shadow-[0_0_6px_#ef4444]"
            )}
          />
          <span className="font-body text-xs text-white/50">
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>
    </header>
  );
}
