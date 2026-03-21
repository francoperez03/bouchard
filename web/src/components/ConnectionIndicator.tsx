import { useConnection } from "../contexts/ConnectionContext";
import { cn } from "@/lib/utils";

export function ConnectionIndicator() {
  const { connected } = useConnection();

  return (
    <div className="flex items-center gap-2 py-2">
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
  );
}
