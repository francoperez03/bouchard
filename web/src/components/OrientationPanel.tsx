import type { SensorData } from "../types/robot";

interface Props {
  sensors: SensorData;
}

export function OrientationPanel({ sensors }: Props) {
  const pitch = sensors.accel.x;
  const roll = sensors.accel.y;
  const heading = ((sensors.pose.theta * 180) / Math.PI);

  // Simplified gyroscope indicator: a tilting line based on pitch/roll
  const tiltAngle = Math.atan2(roll, 9.81) * (180 / Math.PI);
  const pitchOffset = Math.min(Math.max((pitch / 9.81) * 20, -20), 20);

  return (
    <div className="liquid-glass rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg italic text-white">Orientation</h3>
        <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
      </div>

      <div className="mt-4 flex items-center gap-6">
        {/* Visual gyroscope indicator */}
        <div className="flex-shrink-0">
          <svg width={64} height={64} viewBox="0 0 64 64">
            {/* Outer ring */}
            <circle cx={32} cy={32} r={28} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1.5} />
            {/* Horizon line (tilts with roll) */}
            <g transform={`rotate(${tiltAngle}, 32, 32)`}>
              <line
                x1={8} y1={32 + pitchOffset}
                x2={56} y2={32 + pitchOffset}
                stroke="#3b82f6" strokeWidth={2} strokeLinecap="round"
              />
              {/* Center crosshair */}
              <circle cx={32} cy={32} r={3} fill="none" stroke="#3b82f6" strokeWidth={1} />
              <line x1={32} y1={26} x2={32} y2={29} stroke="#3b82f6" strokeWidth={1} />
              <line x1={32} y1={35} x2={32} y2={38} stroke="#3b82f6" strokeWidth={1} />
            </g>
            {/* Fixed reference markers */}
            <line x1={32} y1={4} x2={32} y2={8} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
            <line x1={32} y1={56} x2={32} y2={60} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
          </svg>
        </div>

        {/* Pitch / Roll / Yaw values */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-white/40">Pitch</span>
            <span className="font-body text-sm font-medium text-white">
              {pitch.toFixed(1)}°
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-white/40">Roll</span>
            <span className="font-body text-sm font-medium text-white">
              {roll.toFixed(1)}°
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-white/40">Yaw</span>
            <span className="font-body text-sm font-medium text-white">
              {heading.toFixed(1)}°
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
