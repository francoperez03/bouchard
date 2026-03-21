interface Props {
  terrainZones: Record<string, number>;
}

const TERRAIN_COLORS: Record<string, string> = {
  metal: "#94a3b8",
  carpet: "#a78bfa",
  sand: "#fbbf24",
  rough: "#f97316",
  ramp: "#22d3ee",
};

export function TerrainZones({ terrainZones }: Props) {
  const entries = Object.entries(terrainZones).filter(([, v]) => v > 0);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  return (
    <div className="liquid-glass rounded-2xl p-6">
      <h3 className="font-heading text-lg italic text-white">Terrain Distribution</h3>

      {total === 0 ? (
        <p className="mt-4 font-body text-sm text-white/30">No terrain data</p>
      ) : (
        <>
          {/* Stacked bar */}
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-white/5">
            {entries.map(([name, value]) => (
              <div
                key={name}
                className="transition-all"
                style={{
                  width: `${(value / total) * 100}%`,
                  backgroundColor: TERRAIN_COLORS[name] || "#64748b",
                }}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {entries.map(([name, value]) => (
              <div key={name} className="flex items-center gap-1.5">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: TERRAIN_COLORS[name] || "#64748b" }}
                />
                <span className="font-body text-xs text-white/60">
                  {name} <span className="text-white/40">{value}</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
