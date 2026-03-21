import { motion } from "motion/react";
import type { EventEntry } from "../types/events";

interface Props {
  events: EventEntry[];
}

const TYPE_COLORS: Record<EventEntry["type"], string> = {
  reflex: "#eab308",
  strategy: "#3b82f6",
  emergency: "#ef4444",
  terrain: "rgba(255,255,255,0.6)",
};

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

export function EventFeed({ events }: Props) {
  return (
    <div className="liquid-glass rounded-2xl p-6">
      <h3 className="font-heading text-lg italic text-white">Event Log</h3>

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
              className="flex items-start gap-3 border-b border-white/5 py-2.5 last:border-b-0"
            >
              <div
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: TYPE_COLORS[event.type],
                  boxShadow: `0 0 6px ${TYPE_COLORS[event.type]}60`,
                }}
              />
              <span className="min-w-0 flex-1 font-body text-sm text-white/80">
                {event.message}
              </span>
              <span className="shrink-0 font-body text-xs text-white/30">
                {timeAgo(event.timestamp)}
              </span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
