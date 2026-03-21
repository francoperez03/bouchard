import type { CommandHistoryEntry } from "../types/events";

interface Props {
  entries: CommandHistoryEntry[];
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

export function CommandHistory({ entries }: Props) {
  return (
    <div className="liquid-glass rounded-2xl p-6">
      <h3 className="font-heading text-lg italic text-white">Command Log</h3>

      <div className="mt-4 max-h-[200px] space-y-0 overflow-y-auto">
        {entries.length === 0 ? (
          <p className="font-body text-sm text-white/30">No commands sent</p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 border-b border-white/5 py-2 last:border-b-0"
            >
              <span className="font-body text-sm font-medium text-white/80">
                {entry.command}
              </span>
              <span
                className="rounded-full px-2 py-0.5 font-body text-xs"
                style={{
                  color: entry.color,
                  backgroundColor: `${entry.color}15`,
                }}
              >
                {entry.result}
              </span>
              <span className="ml-auto font-body text-xs text-white/30">
                {timeAgo(entry.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
