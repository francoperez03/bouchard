import { useEffect, useRef } from "react";
import type { MapData, Pose } from "../types/robot";

interface Props {
  map: MapData;
  pose: Pose;
  grid?: number[][];
}

export function MapCanvas({ map, pose, grid }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, w, h);

    // If we have grid data, render cells
    if (grid && grid.length > 0) {
      const rows = grid.length;
      const cols = grid[0].length;
      const cellW = w / cols;
      const cellH = h / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = grid[r][c];
          if (val === 1) {
            ctx.fillStyle = "#334155"; // FREE
            ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
          } else if (val === 2) {
            ctx.fillStyle = "#0f172a"; // OCCUPIED
            ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
          }
          // UNKNOWN stays as background
        }
      }
    }

    // Map world coords to canvas
    const scale = w / 3.0;
    const toX = (x: number) => (x + 1.5) * scale;
    const toY = (y: number) => (1.5 - y) * scale;

    // Obstacles (sampled)
    ctx.fillStyle = "#0f172a";
    for (const [ox, oy] of map.obstacles_sample) {
      ctx.fillRect(toX(ox) - 2, toY(oy) - 2, 4, 4);
    }

    // Frontiers
    ctx.fillStyle = "#3b82f6";
    for (const [fx, fy] of map.frontiers) {
      ctx.beginPath();
      ctx.arc(toX(fx), toY(fy), 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Robot
    const rx = toX(pose.x);
    const ry = toY(pose.y);
    const size = 8;
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

    // Exploration info
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px monospace";
    ctx.fillText(`${map.explored_pct.toFixed(1)}% explorado`, 6, h - 8);
    ctx.fillText(`${map.frontier_count} fronteras`, 6, h - 22);
  }, [map, pose, grid]);

  return (
    <div>
      <h3 style={{ fontSize: 14, marginBottom: 8, color: "#94a3b8" }}>Mapa de Ocupacion</h3>
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        style={{ borderRadius: 6, border: "1px solid #334155" }}
      />
    </div>
  );
}
