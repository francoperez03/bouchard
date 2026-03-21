import type { SensorData } from "../types/robot";

interface Props {
  sensors: SensorData;
}

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

export function SensorMiniOverlay({ sensors }: Props) {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const robotR = 16;
  const maxBarLen = 30;

  return (
    <div className="rounded-xl bg-black/60 p-1 opacity-70 backdrop-blur-sm transition-opacity hover:opacity-100">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={robotR} fill="#334155" stroke="#64748b" strokeWidth={1} />
        <line x1={cx} y1={cy} x2={cx + 10} y2={cy - 3} stroke="#64748b" strokeWidth={0.8} />

        {Object.entries(sensors.proximidad).map(([name, value]) => {
          const angleDeg = SENSOR_ANGLES[name];
          if (angleDeg === undefined) return null;
          const angleRad = ((angleDeg - 90) * Math.PI) / 180;
          const barLen = Math.min((value / 300) * maxBarLen, maxBarLen);
          const x1 = cx + Math.cos(angleRad) * (robotR + 3);
          const y1 = cy + Math.sin(angleRad) * (robotR + 3);
          const x2 = cx + Math.cos(angleRad) * (robotR + 3 + barLen);
          const y2 = cy + Math.sin(angleRad) * (robotR + 3 + barLen);

          return (
            <line
              key={name}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={sensorColor(value)}
              strokeWidth={4}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </div>
  );
}
