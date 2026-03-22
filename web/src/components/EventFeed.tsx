import { motion } from "motion/react";
import type { EventEntry } from "../types/events";

interface Props {
  events: EventEntry[];
}

const TYPE_LABELS: Record<EventEntry["type"], string> = {
  reflex: "WARN",
  strategy: "INFO",
  emergency: "ERROR",
  terrain: "DATA",
};

const TYPE_COLORS: Record<EventEntry["type"], string> = {
  reflex: "#eab308",
  strategy: "#3b82f6",
  emergency: "#ef4444",
  terrain: "rgba(255,255,255,0.6)",
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

export function EventFeed({ events }: Props) {
  return (
    <div className="liquid-glass rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg italic text-white">System Event Log</h3>
        <div className="flex gap-1.5">
          <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_4px_#22c55e]" />
          <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_4px_#3b82f6]" />
        </div>
      </div>

      <div className="mt-4 max-h-[340px] space-y-0 overflow-y-auto">
        {events.length === 0 ? (
          <p className="font-body text-sm text-white/30">No events yet</p>
        ) : (
          events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={i === 0 ? { opacity: 0, y: -8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2 border-b border-white/5 py-2 last:border-b-0 font-body text-sm"
            >
              <span className="shrink-0 text-white/30">
                [{formatTime(event.timestamp)}]
              </span>
              <span
                className="shrink-0 font-medium"
                style={{ color: TYPE_COLORS[event.type] }}
              >
                {TYPE_LABELS[event.type]}:
              </span>
              <span className="min-w-0 flex-1 text-white/70">
                {event.message}
              </span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
