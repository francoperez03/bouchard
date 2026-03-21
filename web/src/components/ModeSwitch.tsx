import { cn } from "@/lib/utils";
import { useCommands } from "../hooks/useCommands";

interface Props {
  mode: "autonomous" | "manual";
}

export function ModeSwitch({ mode }: Props) {
  const { sendCommand } = useCommands();
  const isManual = mode === "manual";

  const toggle = () => {
    sendCommand({
      fn: "set_mode",
      args: { mode: isManual ? "autonomous" : "manual" },
    });
  };

  return (
    <div className="flex items-center gap-3">
      <span className={cn("font-body text-sm", isManual ? "text-white/30" : "text-blue-300")}>
        Auto
      </span>
      <button
        onClick={toggle}
        className={cn(
          "relative h-7 w-12 cursor-pointer rounded-full border-none transition-colors",
          isManual ? "bg-yellow-800" : "bg-blue-900"
        )}
      >
        <div
          className={cn(
            "absolute top-[3px] h-5 w-5 rounded-full transition-[left] duration-200",
            isManual ? "left-[25px] bg-yellow-300" : "left-[3px] bg-blue-300"
          )}
        />
      </button>
      <span className={cn("font-body text-sm", isManual ? "text-yellow-300" : "text-white/30")}>
        Manual
      </span>
    </div>
  );
}
