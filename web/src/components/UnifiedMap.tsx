import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Grid3X3, CircleDot, Map, Route } from "lucide-react";
import type { MapData, Pose } from "../types/robot";

interface Props {
  map: MapData;
  pose: Pose;
  trail: Pose[];
  grid?: number[][];
  overlay?: ReactNode;
  className?: string;
}

const LAYER_BUTTONS = [
  { key: "grid", icon: Grid3X3, label: "Grid" },
  { key: "obstacles", icon: CircleDot, label: "Obstacles" },
  { key: "frontiers", icon: Map, label: "Frontiers" },
  { key: "trail", icon: Route, label: "Trail" },
] as const;

type Layers = Record<string, boolean>;

export function UnifiedMap({ map, pose, trail, grid, overlay, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 600, height: 450 });
  const [layers, setLayers] = useState<Layers>({
    grid: true,
    obstacles: true,
    frontiers: true,
    trail: true,
  });
  const rafRef = useRef(0);

  // ResizeObserver for responsive canvas
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const entry = entries[0];
        if (!entry) return;
        const w = Math.floor(entry.contentRect.width);
        const h = Math.floor(w * 0.75); // 4:3 aspect
        if (w > 0) setSize({ width: w, height: h });
      });
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    ctx.scale(dpr, dpr);

    const w = size.width;
    const h = size.height;

    // Background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, w, h);

    // Coordinate transform: 3x3m arena
    const scaleX = w / 3.0;
    const scaleY = h / 3.0;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (w - 3.0 * scale) / 2;
    const offsetY = (h - 3.0 * scale) / 2;
    const toX = (x: number) => offsetX + (x + 1.5) * scale;
    const toY = (y: number) => offsetY + (1.5 - y) * scale;

    // Subtle grid lines every 0.2m
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 0.5;
    for (let v = -1.5; v <= 1.5; v += 0.2) {
      ctx.beginPath();
      ctx.moveTo(toX(v), toY(-1.5));
      ctx.lineTo(toX(v), toY(1.5));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(toX(-1.5), toY(v));
      ctx.lineTo(toX(1.5), toY(v));
      ctx.stroke();
    }

    // Occupancy grid cells
    if (layers.grid && grid && grid.length > 0) {
      const rows = grid.length;
      const cols = grid[0].length;
      const cellW = (3.0 * scale) / cols;
      const cellH = (3.0 * scale) / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = grid[r][c];
          if (val === 1) {
            ctx.fillStyle = "rgba(255,255,255,0.03)";
            ctx.fillRect(offsetX + c * cellW, offsetY + r * cellH, cellW, cellH);
          } else if (val === 2) {
            ctx.fillStyle = "rgba(255,255,255,0.08)";
            ctx.fillRect(offsetX + c * cellW, offsetY + r * cellH, cellW, cellH);
          }
        }
      }
    }

    // Obstacles
    if (layers.obstacles) {
      ctx.fillStyle = "#1e293b";
      for (const [ox, oy] of map.obstacles_sample) {
        const px = toX(ox);
        const py = toY(oy);
        ctx.fillRect(px - 3, py - 3, 6, 6);
      }
    }

    // Frontiers
    if (layers.frontiers) {
      ctx.fillStyle = "#3b82f6";
      for (const [fx, fy] of map.frontiers) {
        ctx.beginPath();
        ctx.arc(toX(fx), toY(fy), 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Pose trail
    if (layers.trail && trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(toX(trail[0].x), toY(trail[0].y));
      for (let i = 1; i < trail.length; i++) {
        ctx.lineTo(toX(trail[i].x), toY(trail[i].y));
      }
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Robot triangle
    const rx = toX(pose.x);
    const ry = toY(pose.y);
    const triSize = 10;
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(-pose.theta + Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -triSize);
    ctx.lineTo(-triSize * 0.7, triSize * 0.6);
    ctx.lineTo(triSize * 0.7, triSize * 0.6);
    ctx.closePath();
    ctx.fillStyle = "#22c55e";
    ctx.fill();
    ctx.restore();

    // Info overlay text
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px monospace";
    ctx.fillText(`${map.frontier_count} frontiers`, 8, h - 24);
    ctx.fillText(`${map.explored_pct.toFixed(1)}% explored`, 8, h - 8);
  }, [map, pose, trail, grid, layers, size]);

  const toggleLayer = (key: string) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={cn("liquid-glass rounded-2xl p-6", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg italic text-white">Map</h3>
        <div className="flex gap-1">
          {LAYER_BUTTONS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => toggleLayer(key)}
              title={label}
              className={cn(
                "flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors",
                layers[key]
                  ? "bg-white/10 text-white"
                  : "text-white/20 hover:text-white/40"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="relative mt-4">
        <canvas
          ref={canvasRef}
          style={{ width: size.width, height: size.height }}
          className="rounded-xl"
        />
        {overlay && (
          <div className="absolute bottom-4 left-4">{overlay}</div>
        )}
      </div>

      <div className="mt-3 flex gap-4 font-body text-sm text-white/60">
        <span>x: {pose.x.toFixed(3)}m</span>
        <span>y: {pose.y.toFixed(3)}m</span>
        <span>&theta;: {((pose.theta * 180) / Math.PI).toFixed(1)}&deg;</span>
      </div>
    </div>
  );
}
