import { cn } from "@/lib/utils";
import type { SensorData } from "../types/robot";

const SENSOR_ANGLES: Record<string, number> = {
  ps0: 10, ps1: 45, ps2: 90, ps3: 150,
  ps4: 210, ps5: 270, ps6: 315, ps7: 350,
};

const PROX_WARNING = 100;
const PROX_DANGER = 150;

function sensorColor(value: number): string {
  if (value >= PROX_DANGER) return "#ef4444";
  if (value >= PROX_WARNING) return "#eab308";
  return "#22c55e";
}

interface Props {
  sensors: SensorData;
}

export function SensorPanel({ sensors }: Props) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const robotR = 24;
  const maxBarLen = 50;

  // Nearest obstacle distance (front_min is raw IR value, approximate to meters)
  const obstacleDistM = sensors.front_min > 0
    ? Math.max(0, (1 - sensors.front_min / 300) * 1.5).toFixed(2)
    : "—";
  const obstacleColor = sensors.front_min >= PROX_DANGER
    ? "text-red-400"
    : sensors.front_min >= PROX_WARNING
      ? "text-yellow-400"
      : "text-green-400";

  return (
    <div className="liquid-glass rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg italic text-white">IR Array</h3>
        <span className="rounded-full bg-green-500/20 px-3 py-0.5 font-body text-xs font-medium text-green-400">
          Active
        </span>
      </div>

      <div className="mt-4 flex justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Robot body */}
          <circle cx={cx} cy={cy} r={robotR} fill="#334155" stroke="#64748b" strokeWidth={1.5} />
          {/* Front indicator */}
          <line x1={cx} y1={cy} x2={cx + 15} y2={cy - 5} stroke="#64748b" strokeWidth={1} />

          {/* Sensor bars */}
          {Object.entries(sensors.proximidad).map(([name, value]) => {
            const angleDeg = SENSOR_ANGLES[name];
            if (angleDeg === undefined) return null;
            const angleRad = ((angleDeg - 90) * Math.PI) / 180;
            const barLen = Math.min((value / 300) * maxBarLen, maxBarLen);
            const x1 = cx + Math.cos(angleRad) * (robotR + 4);
            const y1 = cy + Math.sin(angleRad) * (robotR + 4);
            const x2 = cx + Math.cos(angleRad) * (robotR + 4 + barLen);
            const y2 = cy + Math.sin(angleRad) * (robotR + 4 + barLen);

            return (
              <g key={name}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={sensorColor(value)}
                  strokeWidth={6}
                  strokeLinecap="round"
                />
                <text
                  x={cx + Math.cos(angleRad) * (robotR + maxBarLen + 14)}
                  y={cy + Math.sin(angleRad) * (robotR + maxBarLen + 14)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={9}
                  fill="#64748b"
                >
                  {Math.round(value)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Obstacle distance readout */}
      <div className="mt-4 flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
        <span className="font-body text-xs text-white/40">Obstacle</span>
        <div className="flex items-baseline gap-1">
          <span className={cn("font-heading text-2xl italic", obstacleColor)}>
            {obstacleDistM}
          </span>
          <span className="font-body text-sm text-white/40">m</span>
        </div>
      </div>
    </div>
  );
}
