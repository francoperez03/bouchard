import { cn } from "@/lib/utils";
import { useCommands } from "../hooks/useCommands";

interface Props {
  mode: "autonomous" | "manual";
}

const MODES = [
  {
    id: "manual" as const,
    label: "Manual",
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={12} cy={7} r={4} />
        <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
      </svg>
    ),
  },
  {
    id: "autonomous" as const,
    label: "Autonomous",
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4" />
        <path d="M12 18v4" />
        <path d="M4.93 4.93l2.83 2.83" />
        <path d="M16.24 16.24l2.83 2.83" />
        <path d="M2 12h4" />
        <path d="M18 12h4" />
        <circle cx={12} cy={12} r={3} />
      </svg>
    ),
  },
] as const;

export function ModeSwitch({ mode }: Props) {
  const { sendCommand } = useCommands();

  return (
    <div className="flex w-full gap-2">
      {MODES.map((m) => {
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            onClick={() => sendCommand({ fn: "set_mode", args: { mode: m.id } })}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 font-body text-sm font-medium transition-all",
              active
                ? "liquid-glass-strong text-white shadow-lg"
                : "bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50"
            )}
          >
            {m.icon}
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
