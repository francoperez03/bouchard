import type { SensorData } from "../types/robot";

interface Props {
  sensors: SensorData;
}

function gaugeColor(value: number, warnAt: number, dangerAt: number): string {
  if (value >= dangerAt) return "#ef4444";
  if (value >= warnAt) return "#eab308";
  return "#22c55e";
}

function Bar({
  label,
  value,
  max,
  warnAt,
  dangerAt,
  unit = "",
  bidirectional = false,
}: {
  label: string;
  value: number;
  max: number;
  warnAt: number;
  dangerAt: number;
  unit?: string;
  bidirectional?: boolean;
}) {
  const absVal = Math.abs(value);
  const pct = Math.min((absVal / max) * 100, 100);
  const color = gaugeColor(absVal, warnAt, dangerAt);

  if (bidirectional) {
    const halfPct = Math.min((absVal / max) * 50, 50);
    return (
      <div className="flex items-center gap-2">
        <span className="w-6 font-body text-xs text-white/40">{label}</span>
        <div className="relative h-1.5 flex-1 rounded-full bg-white/10">
          <div className="absolute top-0 left-1/2 h-full w-px bg-white/20" />
          <div
            className="absolute top-0 h-full rounded-full transition-all"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 4px ${color}40`,
              ...(value >= 0
                ? { left: "50%", width: `${halfPct}%` }
                : { right: "50%", width: `${halfPct}%` }),
            }}
          />
        </div>
        <span className="w-14 text-right font-body text-xs text-white/60">
          {value.toFixed(1)}{unit}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="w-6 font-body text-xs text-white/40">{label}</span>
      <div className="h-1.5 flex-1 rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            boxShadow: `0 0 4px ${color}40`,
          }}
        />
      </div>
      <span className="w-14 text-right font-body text-xs text-white/60">
        {value.toFixed(1)}{unit}
      </span>
    </div>
  );
}

export function IMUPanel({ sensors }: Props) {
  return (
    <div className="liquid-glass rounded-2xl p-6">
      <h3 className="font-heading text-lg italic text-white">Telemetry</h3>

      <div className="mt-4 space-y-4">
        {/* Accelerometer */}
        <div>
          <div className="mb-1.5 font-body text-xs text-white/40">Accelerometer (m/s²)</div>
          <div className="space-y-1.5">
            <Bar label="x" value={sensors.accel.x} max={15} warnAt={8} dangerAt={12} bidirectional />
            <Bar label="y" value={sensors.accel.y} max={15} warnAt={8} dangerAt={12} bidirectional />
            <Bar label="z" value={sensors.accel.z} max={15} warnAt={12} dangerAt={14} bidirectional />
          </div>
        </div>

        {/* Gyroscope */}
        <div>
          <div className="mb-1.5 font-body text-xs text-white/40">Gyroscope (rad/s)</div>
          <div className="space-y-1.5">
            <Bar label="x" value={sensors.gyro.x} max={5} warnAt={2} dangerAt={4} bidirectional />
            <Bar label="y" value={sensors.gyro.y} max={5} warnAt={2} dangerAt={4} bidirectional />
            <Bar label="z" value={sensors.gyro.z} max={5} warnAt={2} dangerAt={4} bidirectional />
          </div>
        </div>

        {/* Vibration & Inclination */}
        <div className="space-y-1.5">
          <Bar label="vib" value={sensors.vibracion} max={1} warnAt={0.3} dangerAt={0.7} />
          <Bar label="tilt" value={sensors.inclinacion} max={45} warnAt={10} dangerAt={25} unit="°" />
        </div>

        {/* Odometry */}
        <div className="flex gap-4 font-body text-xs text-white/40">
          <span>odo L: <span className="text-white/60">{sensors.odometria.izq.toFixed(2)} rad</span></span>
          <span>odo R: <span className="text-white/60">{sensors.odometria.der.toFixed(2)} rad</span></span>
        </div>
      </div>
    </div>
  );
}
