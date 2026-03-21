import { useEffect, useRef } from "react";
import type { Pose } from "../types/robot";

interface Props {
  pose: Pose;
  trail: Pose[];
}

export function PoseDisplay({ pose, trail }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= w; i += 20) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
    }

    // Map world coords to canvas: arena is 3x3m centered at (0,0)
    const scale = w / 3.0;
    const toX = (x: number) => (x + 1.5) * scale;
    const toY = (y: number) => (1.5 - y) * scale;

    // Trail
    if (trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(toX(trail[0].x), toY(trail[0].y));
      for (let i = 1; i < trail.length; i++) {
        ctx.lineTo(toX(trail[i].x), toY(trail[i].y));
      }
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Robot position as triangle
    const rx = toX(pose.x);
    const ry = toY(pose.y);
    const size = 6;
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(-pose.theta + Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(-size * 0.7, size * 0.6);
    ctx.lineTo(size * 0.7, size * 0.6);
    ctx.closePath();
    ctx.fillStyle = "#22c55e";
    ctx.fill();
    ctx.restore();
  }, [pose, trail]);

  return (
    <div>
      <h3 style={{ fontSize: 14, marginBottom: 8, color: "#94a3b8" }}>Pose</h3>
      <div style={{ display: "flex", gap: 16, marginBottom: 8, fontSize: 13, color: "#e2e8f0" }}>
        <span>x: {pose.x.toFixed(3)}m</span>
        <span>y: {pose.y.toFixed(3)}m</span>
        <span>&theta;: {((pose.theta * 180) / Math.PI).toFixed(1)}&deg;</span>
      </div>
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        style={{ borderRadius: 6, border: "1px solid #334155" }}
      />
    </div>
  );
}
