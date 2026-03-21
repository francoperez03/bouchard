#!/usr/bin/env python3
"""
Dashboard de metricas para Bouchard robot navigation.
Lee terrain_log.csv y genera visualizaciones.

Uso:
    python dashboard.py <csv_file>
    python dashboard.py <csv_file> --output report.png
    python dashboard.py --compare file1.csv file2.csv --labels claude fallback
"""

import argparse
import csv
import sys
from pathlib import Path

try:
    import matplotlib
    matplotlib.use('Agg')  # non-interactive backend
    import matplotlib.pyplot as plt
    from matplotlib.gridspec import GridSpec
    HAS_MATPLOTLIB = True
except ImportError:
    HAS_MATPLOTLIB = False
    print("Warning: matplotlib not installed. Install with: pip install matplotlib")


def read_csv(path):
    """Read terrain_log.csv and return list of row dicts."""
    rows = []
    with open(path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def extract_metrics(rows):
    """Extract time series metrics from CSV rows."""
    steps = []
    x_pos = []
    y_pos = []
    terrains = []
    slips = []
    actions = []
    distances = []

    cumulative_dist = 0.0
    prev_x, prev_y = None, None

    for r in rows:
        step = int(r.get('step', 0))
        x = float(r.get('x', 0))
        y = float(r.get('y', 0))

        steps.append(step)
        x_pos.append(x)
        y_pos.append(y)
        terrains.append(r.get('terreno', ''))
        slips.append(float(r.get('slip', 0) or 0))
        actions.append(r.get('action', ''))

        if prev_x is not None:
            dx = x - prev_x
            dy = y - prev_y
            cumulative_dist += (dx*dx + dy*dy) ** 0.5
        distances.append(cumulative_dist)
        prev_x, prev_y = x, y

    # Exploration over time (unique 5cm cells seen so far)
    exploration = []
    seen = set()
    for x, y in zip(x_pos, y_pos):
        gx = round(x / 0.05)
        gy = round(y / 0.05)
        seen.add((gx, gy))
        exploration.append(len(seen))

    # Collision events
    collision_steps = [s for s, a in zip(steps, actions)
                       if 'emergency' in a or 'obstacle' in a]

    # Terrain distribution
    terrain_counts = {}
    for t in terrains:
        if t:
            terrain_counts[t] = terrain_counts.get(t, 0) + 1

    return {
        'steps': steps,
        'x': x_pos,
        'y': y_pos,
        'terrains': terrains,
        'slips': slips,
        'distances': distances,
        'exploration': exploration,
        'collision_steps': collision_steps,
        'terrain_counts': terrain_counts,
        'total_steps': len(rows),
        'total_distance': round(cumulative_dist, 2),
        'total_collisions': len(collision_steps),
        'unique_cells': len(seen),
    }


def plot_single(metrics, title="Bouchard Session", output=None):
    """Generate a 2x2 dashboard for a single run."""
    if not HAS_MATPLOTLIB:
        print_text_summary(metrics)
        return

    fig = plt.figure(figsize=(14, 10))
    fig.suptitle(title, fontsize=14, fontweight='bold')
    gs = GridSpec(2, 2, figure=fig, hspace=0.3, wspace=0.3)

    # 1. Robot trajectory (top left)
    ax1 = fig.add_subplot(gs[0, 0])
    scatter = ax1.scatter(metrics['x'], metrics['y'], c=range(len(metrics['x'])),
                         cmap='viridis', s=1, alpha=0.5)
    ax1.set_xlabel('X (m)')
    ax1.set_ylabel('Y (m)')
    ax1.set_title('Robot Trajectory')
    ax1.set_aspect('equal')
    plt.colorbar(scatter, ax=ax1, label='Step')

    # Mark collisions
    for cs in metrics['collision_steps']:
        idx = metrics['steps'].index(cs) if cs in metrics['steps'] else None
        if idx:
            ax1.plot(metrics['x'][idx], metrics['y'][idx], 'rx', markersize=4)

    # 2. Exploration over time (top right)
    ax2 = fig.add_subplot(gs[0, 1])
    ax2.plot(metrics['steps'], metrics['exploration'], 'b-', linewidth=1)
    ax2.set_xlabel('Step')
    ax2.set_ylabel('Unique cells explored')
    ax2.set_title(f'Exploration ({metrics["unique_cells"]} cells)')
    ax2.grid(True, alpha=0.3)

    # 3. Distance over time (bottom left)
    ax3 = fig.add_subplot(gs[1, 0])
    ax3.plot(metrics['steps'], metrics['distances'], 'g-', linewidth=1)
    ax3.set_xlabel('Step')
    ax3.set_ylabel('Cumulative distance (m)')
    ax3.set_title(f'Distance ({metrics["total_distance"]}m)')
    ax3.grid(True, alpha=0.3)

    # Overlay slip
    ax3b = ax3.twinx()
    ax3b.plot(metrics['steps'], metrics['slips'], 'r-', alpha=0.3, linewidth=0.5)
    ax3b.set_ylabel('Slip ratio', color='red')

    # 4. Terrain distribution (bottom right)
    ax4 = fig.add_subplot(gs[1, 1])
    tc = metrics['terrain_counts']
    if tc:
        colors = {'metal': '#B0B0B0', 'sand': '#E0C890', 'carpet': '#8B4513',
                  'rough': '#808070', 'ramp': '#909080'}
        bars = ax4.bar(tc.keys(), tc.values(),
                      color=[colors.get(t, '#666') for t in tc.keys()])
        ax4.set_ylabel('Steps on terrain')
        ax4.set_title('Terrain Distribution')

    # Summary text
    summary = (f"Steps: {metrics['total_steps']} | "
               f"Distance: {metrics['total_distance']}m | "
               f"Collisions: {metrics['total_collisions']} | "
               f"Cells: {metrics['unique_cells']}")
    fig.text(0.5, 0.02, summary, ha='center', fontsize=10, style='italic')

    if output:
        plt.savefig(output, dpi=150, bbox_inches='tight')
        print(f"Dashboard saved to {output}")
    else:
        plt.savefig('dashboard.png', dpi=150, bbox_inches='tight')
        print("Dashboard saved to dashboard.png")
    plt.close()


def plot_comparison(metrics_list, labels, output=None):
    """Compare multiple runs on the same plot."""
    if not HAS_MATPLOTLIB:
        for m, l in zip(metrics_list, labels):
            print(f"\n=== {l} ===")
            print_text_summary(m)
        return

    fig, axes = plt.subplots(1, 3, figsize=(16, 5))
    fig.suptitle('Strategy Comparison', fontsize=14, fontweight='bold')

    colors = ['#2196F3', '#FF9800', '#4CAF50', '#F44336', '#9C27B0']

    for i, (m, label) in enumerate(zip(metrics_list, labels)):
        c = colors[i % len(colors)]

        # Trajectories
        axes[0].scatter(m['x'], m['y'], s=0.5, alpha=0.3, c=c, label=label)

        # Exploration
        axes[1].plot(m['steps'], m['exploration'], c=c, label=label, linewidth=1)

        # Distance
        axes[2].plot(m['steps'], m['distances'], c=c, label=label, linewidth=1)

    axes[0].set_title('Trajectories')
    axes[0].set_xlabel('X (m)')
    axes[0].set_ylabel('Y (m)')
    axes[0].set_aspect('equal')
    axes[0].legend(markerscale=10)

    axes[1].set_title('Exploration')
    axes[1].set_xlabel('Step')
    axes[1].set_ylabel('Unique cells')
    axes[1].legend()
    axes[1].grid(True, alpha=0.3)

    axes[2].set_title('Distance')
    axes[2].set_xlabel('Step')
    axes[2].set_ylabel('Distance (m)')
    axes[2].legend()
    axes[2].grid(True, alpha=0.3)

    plt.tight_layout()
    out = output or 'comparison.png'
    plt.savefig(out, dpi=150, bbox_inches='tight')
    print(f"Comparison saved to {out}")
    plt.close()


def print_text_summary(metrics):
    """Print text-only summary when matplotlib is unavailable."""
    print(f"  Steps: {metrics['total_steps']}")
    print(f"  Distance: {metrics['total_distance']}m")
    print(f"  Cells explored: {metrics['unique_cells']}")
    print(f"  Collisions: {metrics['total_collisions']}")
    print(f"  Terrains: {metrics['terrain_counts']}")


def generate_markdown_report(metrics, label="Session"):
    """Generate markdown summary."""
    lines = [
        f"# {label} Report\n",
        f"- **Steps**: {metrics['total_steps']}",
        f"- **Distance**: {metrics['total_distance']}m",
        f"- **Cells explored**: {metrics['unique_cells']}",
        f"- **Collisions**: {metrics['total_collisions']}",
        f"- **Terrain distribution**: {metrics['terrain_counts']}",
        "",
    ]
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description='Bouchard metrics dashboard')
    parser.add_argument('csv_file', nargs='?', help='Path to terrain_log.csv')
    parser.add_argument('--output', '-o', help='Output image path')
    parser.add_argument('--compare', nargs='+', help='CSV files to compare')
    parser.add_argument('--labels', nargs='+', help='Labels for comparison')
    parser.add_argument('--markdown', action='store_true', help='Output markdown report')

    args = parser.parse_args()

    if args.compare:
        labels = args.labels or [Path(f).stem for f in args.compare]
        metrics_list = []
        for f in args.compare:
            rows = read_csv(f)
            metrics_list.append(extract_metrics(rows))
        plot_comparison(metrics_list, labels, output=args.output)
    elif args.csv_file:
        rows = read_csv(args.csv_file)
        metrics = extract_metrics(rows)

        if args.markdown:
            print(generate_markdown_report(metrics))
        else:
            plot_single(metrics, title=Path(args.csv_file).stem, output=args.output)
            print_text_summary(metrics)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
