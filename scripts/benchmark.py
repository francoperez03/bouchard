#!/usr/bin/env python3
"""
Benchmark system for comparing navigation strategies.

Usage:
    # Run with specific strategy (set env var, then run in Webots)
    export BOUCHARD_STRATEGY=fallback
    # ... run Webots simulation ...

    # Analyze results
    python benchmark.py analyze --dir results/
    python benchmark.py compare --files run1.csv run2.csv run3.csv
"""

import argparse
import csv
import os
import sys
from pathlib import Path


class BenchmarkAnalyzer:
    """Analyze terrain_log.csv files and compute navigation metrics."""

    def __init__(self):
        self.results = []

    def analyze_csv(self, csv_path, strategy="unknown", arena="unknown"):
        """Parse a terrain_log.csv and extract metrics."""
        rows = []
        with open(csv_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append(row)

        if not rows:
            return None

        total_steps = len(rows)

        # Collisions: count emergency/obstacle actions
        collisions = sum(1 for r in rows if 'emergency' in r.get('action', '')
                        or 'obstacle' in r.get('action', ''))

        # Distance: sum of position changes
        distance = 0.0
        for i in range(1, len(rows)):
            try:
                dx = float(rows[i].get('x', 0)) - float(rows[i-1].get('x', 0))
                dy = float(rows[i].get('y', 0)) - float(rows[i-1].get('y', 0))
                distance += (dx*dx + dy*dy) ** 0.5
            except (ValueError, KeyError):
                pass

        # Unique positions (gridded to 5cm) as exploration proxy
        positions = set()
        for r in rows:
            try:
                gx = round(float(r.get('x', 0)) / 0.05) * 0.05
                gy = round(float(r.get('y', 0)) / 0.05) * 0.05
                positions.add((gx, gy))
            except (ValueError, KeyError):
                pass

        # Terrains encountered
        terrains = set(r.get('terreno', '') for r in rows if r.get('terreno'))

        # Deadlocks: periods of no movement (>50 steps with <0.01m distance)
        deadlocks = 0
        window = 50
        for i in range(window, len(rows)):
            try:
                dx = float(rows[i].get('x', 0)) - float(rows[i-window].get('x', 0))
                dy = float(rows[i].get('y', 0)) - float(rows[i-window].get('y', 0))
                if (dx*dx + dy*dy) < 0.0001:
                    deadlocks += 1
            except (ValueError, KeyError):
                pass
        deadlocks = deadlocks // window  # approximate count

        result = {
            "strategy": strategy,
            "arena": arena,
            "csv_path": str(csv_path),
            "total_steps": total_steps,
            "distance_m": round(distance, 2),
            "unique_positions": len(positions),
            "collisions": collisions,
            "deadlocks": deadlocks,
            "terrains": len(terrains),
            "path_efficiency": round(len(positions) / max(distance, 0.1), 2),
        }
        self.results.append(result)
        return result

    def analyze_directory(self, dir_path):
        """Analyze all CSV files in a directory."""
        dir_path = Path(dir_path)
        for csv_file in sorted(dir_path.glob('*.csv')):
            # Try to infer strategy from filename
            name = csv_file.stem
            strategy = "unknown"
            for s in ("claude", "fallback", "random"):
                if s in name.lower():
                    strategy = s
                    break
            self.analyze_csv(csv_file, strategy=strategy)

    def to_markdown(self):
        """Generate markdown comparison table."""
        if not self.results:
            return "No results to compare."

        lines = []
        lines.append("# Benchmark Results\n")
        lines.append("| Strategy | Steps | Distance (m) | Coverage (cells) | Collisions | Deadlocks | Path Eff. |")
        lines.append("|----------|-------|-------------|-----------------|------------|-----------|-----------|")

        for r in self.results:
            lines.append(
                f"| {r['strategy']} | {r['total_steps']} | {r['distance_m']} | "
                f"{r['unique_positions']} | {r['collisions']} | {r['deadlocks']} | "
                f"{r['path_efficiency']} |"
            )

        # Summary by strategy
        strategies = set(r['strategy'] for r in self.results)
        if len(strategies) > 1:
            lines.append("\n## Summary by Strategy\n")
            lines.append("| Strategy | Avg Distance | Avg Coverage | Avg Collisions |")
            lines.append("|----------|-------------|-------------|----------------|")
            for s in sorted(strategies):
                runs = [r for r in self.results if r['strategy'] == s]
                avg_dist = sum(r['distance_m'] for r in runs) / len(runs)
                avg_cov = sum(r['unique_positions'] for r in runs) / len(runs)
                avg_col = sum(r['collisions'] for r in runs) / len(runs)
                lines.append(f"| {s} | {avg_dist:.1f} | {avg_cov:.0f} | {avg_col:.0f} |")

        return "\n".join(lines)

    def to_csv(self, output_path):
        """Export raw results as CSV."""
        if not self.results:
            return
        with open(output_path, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=self.results[0].keys())
            writer.writeheader()
            writer.writerows(self.results)
        print(f"Results saved to {output_path}")


def main():
    parser = argparse.ArgumentParser(description='Benchmark navigation strategies')
    sub = parser.add_subparsers(dest='command')

    # analyze command
    analyze = sub.add_parser('analyze', help='Analyze CSV log files')
    analyze.add_argument('--dir', required=True, help='Directory with CSV files')
    analyze.add_argument('--output', default=None, help='Output markdown file')

    # compare command
    compare = sub.add_parser('compare', help='Compare specific CSV files')
    compare.add_argument('--files', nargs='+', required=True, help='CSV files to compare')
    compare.add_argument('--strategies', nargs='+', help='Strategy labels for each file')
    compare.add_argument('--output', default=None, help='Output markdown file')

    # single command
    single = sub.add_parser('single', help='Analyze a single CSV file')
    single.add_argument('csv_file', help='Path to terrain_log.csv')
    single.add_argument('--strategy', default='unknown', help='Strategy name')

    args = parser.parse_args()

    analyzer = BenchmarkAnalyzer()

    if args.command == 'analyze':
        analyzer.analyze_directory(args.dir)
    elif args.command == 'compare':
        strategies = args.strategies or ['unknown'] * len(args.files)
        for f, s in zip(args.files, strategies):
            analyzer.analyze_csv(f, strategy=s)
    elif args.command == 'single':
        result = analyzer.analyze_csv(args.csv_file, strategy=args.strategy)
        if result:
            for k, v in result.items():
                print(f"  {k}: {v}")
        return
    else:
        parser.print_help()
        return

    md = analyzer.to_markdown()
    print(md)

    if hasattr(args, 'output') and args.output:
        with open(args.output, 'w') as f:
            f.write(md)
        print(f"\nSaved to {args.output}")

        # Also save raw CSV
        csv_out = args.output.replace('.md', '.csv')
        analyzer.to_csv(csv_out)


if __name__ == '__main__':
    main()
