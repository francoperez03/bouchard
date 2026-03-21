#!/usr/bin/env python3
"""Generate Webots .wbt world files with procedural arenas.

Standalone script -- no Webots installation required.
Outputs valid VRML97 (Webots flavour) with EXTERNPROTO declarations.

PRD-12: Complex Arena Generator
"""

from __future__ import annotations

import argparse
import math
import os
import random
import sys
import textwrap
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional, Tuple

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

WEBOTS_BASE = "https://raw.githubusercontent.com/cyberbotics/webots/R2025a/projects"

EXTERNPROTOS = {
    "TexturedBackground": f"{WEBOTS_BASE}/objects/backgrounds/protos/TexturedBackground.proto",
    "TexturedBackgroundLight": f"{WEBOTS_BASE}/objects/backgrounds/protos/TexturedBackgroundLight.proto",
    "RectangleArena": f"{WEBOTS_BASE}/objects/floors/protos/RectangleArena.proto",
    "ThreadMetalPlate": f"{WEBOTS_BASE}/appearances/protos/ThreadMetalPlate.proto",
    "Roughcast": f"{WEBOTS_BASE}/appearances/protos/Roughcast.proto",
    "SandyGround": f"{WEBOTS_BASE}/appearances/protos/SandyGround.proto",
    "DryMud": f"{WEBOTS_BASE}/appearances/protos/DryMud.proto",
    "TrafficCone": f"{WEBOTS_BASE}/objects/traffic/protos/TrafficCone.proto",
    "WoodenBox": f"{WEBOTS_BASE}/objects/factory/containers/protos/WoodenBox.proto",
    "CardboardBox": f"{WEBOTS_BASE}/objects/factory/containers/protos/CardboardBox.proto",
    "PlasticCrate": f"{WEBOTS_BASE}/objects/factory/containers/protos/PlasticCrate.proto",
    "OilBarrel": f"{WEBOTS_BASE}/objects/obstacles/protos/OilBarrel.proto",
}

EPUCK_PROTO = "../protos/E-puck.proto"

PRESETS = {
    "easy":   {"size": 5,  "obstacles": 10, "corridors": 0, "dead_ends": 0},
    "medium": {"size": 10, "obstacles": 25, "corridors": 2, "dead_ends": 1},
    "hard":   {"size": 15, "obstacles": 50, "corridors": 4, "dead_ends": 2},
}

SPAWN_EXCLUSION_RADIUS = 0.6  # metres around origin where obstacles are forbidden

# Terrain zone definitions: (material_name, appearance_block_fn)
TERRAIN_TYPES = ["metal", "sand", "carpet", "rough", "ramp"]

# Obstacle catalogue: (proto_name, y_offset, size_spec | None)
OBSTACLE_CATALOGUE = [
    ("TrafficCone", 0.0, None),
    ("WoodenBox", 0.05, "0.1 0.1 0.1"),
    ("CardboardBox", 0.05, "0.1 0.1 0.1"),
    ("OilBarrel", 0.44, None),
    ("PlasticCrate", 0.0, "0.15 0.25 0.1"),
]

# ---------------------------------------------------------------------------
# Geometry helpers
# ---------------------------------------------------------------------------

@dataclass
class AABB:
    """Axis-aligned bounding box for overlap testing."""
    cx: float
    cy: float
    hw: float  # half-width  (x)
    hh: float  # half-height (y)

    def overlaps(self, other: "AABB", padding: float = 0.05) -> bool:
        return (
            abs(self.cx - other.cx) < (self.hw + other.hw + padding)
            and abs(self.cy - other.cy) < (self.hh + other.hh + padding)
        )


def _near_origin(x: float, y: float) -> bool:
    return math.hypot(x, y) < SPAWN_EXCLUSION_RADIUS


# ---------------------------------------------------------------------------
# VRML fragment builders
# ---------------------------------------------------------------------------

def _indent(text: str, n: int = 2) -> str:
    prefix = " " * n
    return "\n".join(prefix + line if line.strip() else line for line in text.splitlines())


def build_externprotos() -> str:
    lines = ['#VRML_SIM R2025a utf8', '']
    for name, url in EXTERNPROTOS.items():
        lines.append(f'EXTERNPROTO "{url}"')
    lines.append(f'EXTERNPROTO "{EPUCK_PROTO}"')
    lines.append('')
    return "\n".join(lines)


def build_worldinfo(size: float) -> str:
    return textwrap.dedent(f"""\
        WorldInfo {{
          info [
            "Procedurally generated arena ({size:.0f}m)."
          ]
          title "Generated Arena {size:.0f}m"
          basicTimeStep 32
          contactProperties [
            ContactProperties {{
              material1 "default"
              material2 "metal"
              coulombFriction [0.8]
            }}
            ContactProperties {{
              material1 "default"
              material2 "sand"
              coulombFriction [0.3]
              forceDependentSlip [0.02]
            }}
            ContactProperties {{
              material1 "default"
              material2 "carpet"
              coulombFriction [1.2]
            }}
            ContactProperties {{
              material1 "default"
              material2 "rough"
              coulombFriction [0.5]
            }}
            ContactProperties {{
              material1 "default"
              material2 "ramp"
              coulombFriction [0.6]
            }}
          ]
        }}""")


def build_viewpoint(size: float) -> str:
    dist = size * 0.6
    height = size * 0.55
    return textwrap.dedent(f"""\
        Viewpoint {{
          orientation 0.105 0.289 -0.951 0.732
          position {-dist:.2f} {dist:.2f} {height:.2f}
          followType "None"
          followSmoothness 0
        }}""")


def build_background() -> str:
    return textwrap.dedent("""\
        TexturedBackground {
          texture "factory"
        }
        TexturedBackgroundLight {
          texture "factory"
        }""")


def build_rectangle_arena(size: float) -> str:
    tile = max(0.5, size / 6.0)
    return textwrap.dedent(f"""\
        # === ARENA BASE ===
        RectangleArena {{
          floorSize {size} {size}
          floorTileSize {tile:.2f} {tile:.2f}
          floorAppearance ThreadMetalPlate {{
            textureTransform TextureTransform {{
              scale 0.7 0.7
            }}
          }}
          wallThickness 0.05
          wallHeight 0.3
          wallAppearance Roughcast {{
            colorOverride 0.5 0.5 0.5
            textureTransform TextureTransform {{
              scale 3 3
            }}
          }}
          contactMaterial "metal"
        }}""")


# ---- Terrain zones -------------------------------------------------------

def _appearance_block(terrain_type: str) -> str:
    """Return the VRML appearance node for a given terrain type."""
    if terrain_type == "metal":
        return textwrap.dedent("""\
            ThreadMetalPlate {
              textureTransform TextureTransform {
                scale 3 3
              }
            }""")
    if terrain_type == "sand":
        return textwrap.dedent("""\
            SandyGround {
              textureTransform TextureTransform {
                scale 3 3
              }
            }""")
    if terrain_type == "carpet":
        return textwrap.dedent("""\
            PBRAppearance {
              baseColor 0.5 0.1 0.1
              roughness 1.0
              metalness 0
            }""")
    if terrain_type == "rough":
        return textwrap.dedent("""\
            DryMud {
              textureTransform TextureTransform {
                scale 3 3
              }
            }""")
    # ramp
    return textwrap.dedent("""\
        PBRAppearance {
          baseColor 0.4 0.4 0.4
          roughness 0.7
          metalness 0.3
        }""")


def build_terrain_zones(size: float, rng: random.Random) -> Tuple[str, List[AABB]]:
    """Tile the arena floor with random terrain patches.

    Returns (vrml_text, list_of_aabb) so later placement can avoid terrain
    bounding boxes if desired.
    """
    half = size / 2.0
    # Divide arena into a grid of patches (excluding a thin border for walls).
    patch_size = max(1.0, size / 4.0)
    patches: list[str] = []
    aabbs: list[AABB] = []
    idx = 0

    x = -half + patch_size / 2 + 0.1
    while x < half - 0.1:
        y = -half + patch_size / 2 + 0.1
        while y < half - 0.1:
            terrain = rng.choice(TERRAIN_TYPES)

            # Ramps get special rotation and a small z-offset.
            is_ramp = terrain == "ramp"
            z = 0.08 if is_ramp else 0.003
            rotation_line = ""
            if is_ramp:
                angle = rng.uniform(0.1, 0.3)
                axis = rng.choice(["1 0 0", "0 1 0"])
                rotation_line = f"\n  rotation {axis} {angle:.3f}"

            actual_w = patch_size * rng.uniform(0.7, 0.95)
            actual_h = patch_size * rng.uniform(0.7, 0.95)
            thickness = 0.01 if is_ramp else 0.005

            appearance = _indent(_appearance_block(terrain), 6)
            node = textwrap.dedent(f"""\
                Solid {{
                  translation {x:.3f} {y:.3f} {z}{rotation_line}
                  children [
                    Shape {{
                      appearance {appearance.strip()}
                      geometry Box {{
                        size {actual_w:.3f} {actual_h:.3f} {thickness}
                      }}
                    }}
                  ]
                  name "terrain_{idx}"
                  contactMaterial "{terrain}"
                  boundingObject Box {{
                    size {actual_w:.3f} {actual_h:.3f} {thickness}
                  }}
                }}""")
            patches.append(node)
            aabbs.append(AABB(x, y, actual_w / 2, actual_h / 2))
            idx += 1
            y += patch_size
        x += patch_size

    header = "# === TERRAIN ZONES ==="
    return header + "\n" + "\n\n".join(patches), aabbs


# ---- Internal walls -------------------------------------------------------

def _wall_solid(name: str, tx: float, ty: float, tz: float,
                sx: float, sy: float, sz: float,
                rotation: Optional[str] = None) -> str:
    rot_line = f"\n  rotation {rotation}" if rotation else ""
    return textwrap.dedent(f"""\
        Solid {{
          translation {tx:.3f} {ty:.3f} {tz:.3f}{rot_line}
          children [
            Shape {{
              appearance PBRAppearance {{
                baseColor 0.55 0.55 0.55
                roughness 0.8
                metalness 0.2
              }}
              geometry Box {{
                size {sx:.3f} {sy:.3f} {sz:.3f}
              }}
            }}
          ]
          name "{name}"
          boundingObject Box {{
            size {sx:.3f} {sy:.3f} {sz:.3f}
          }}
        }}""")


def build_internal_walls(size: float, num_corridors: int,
                         rng: random.Random) -> Tuple[str, List[AABB]]:
    """Create internal wall segments with gaps (corridors).

    Walls span partial lengths of the arena, leaving corridor gaps.
    """
    if num_corridors == 0:
        return "", []

    half = size / 2.0
    wall_height = 0.25
    wall_thickness = 0.05
    segments: list[str] = []
    aabbs: list[AABB] = []
    idx = 0

    for i in range(num_corridors):
        # Alternate between x-aligned and y-aligned walls.
        horizontal = i % 2 == 0
        # Position wall at a random offset from centre.
        offset = rng.uniform(-half * 0.5, half * 0.5)
        # Create two segments with a gap in between.
        gap_centre = rng.uniform(-half * 0.25, half * 0.25)
        gap_width = rng.uniform(0.4, 0.8)
        # Segment before the gap.
        seg_start = -half + 0.15
        seg_end_1 = gap_centre - gap_width / 2
        seg_start_2 = gap_centre + gap_width / 2
        seg_end = half - 0.15

        for (a, b) in [(seg_start, seg_end_1), (seg_start_2, seg_end)]:
            length = b - a
            if length < 0.2:
                continue
            centre = (a + b) / 2.0
            if horizontal:
                tx, ty = centre, offset
                sx, sy = length, wall_thickness
            else:
                tx, ty = offset, centre
                sx, sy = wall_thickness, length

            name = f"wall_seg_{idx}"
            segments.append(_wall_solid(name, tx, ty, wall_height / 2,
                                        sx, sy, wall_height))
            aabbs.append(AABB(tx, ty, sx / 2, sy / 2))
            idx += 1

    if not segments:
        return "", []
    header = "# === INTERNAL WALLS ==="
    return header + "\n" + "\n\n".join(segments), aabbs


# ---- Dead-end alcoves -----------------------------------------------------

def build_dead_ends(size: float, count: int,
                    rng: random.Random) -> Tuple[str, List[AABB]]:
    """Generate U-shaped dead-end alcoves along arena edges."""
    if count == 0:
        return "", []

    half = size / 2.0
    wall_h = 0.25
    wall_t = 0.05
    alcove_depth = rng.uniform(0.5, min(1.2, size * 0.12))
    alcove_width = rng.uniform(0.5, min(1.0, size * 0.1))
    segments: list[str] = []
    aabbs: list[AABB] = []
    idx = 0

    edges = ["north", "south", "east", "west"]
    rng.shuffle(edges)

    for i in range(min(count, len(edges))):
        edge = edges[i]
        lateral = rng.uniform(-half * 0.4, half * 0.4)

        if edge == "north":
            base_y = half - 0.15
            cx, cy = lateral, base_y - alcove_depth / 2
            # Back wall
            segments.append(_wall_solid(
                f"deadend_{idx}_back", cx, base_y, wall_h / 2,
                alcove_width, wall_t, wall_h))
            # Left wall
            segments.append(_wall_solid(
                f"deadend_{idx}_left", cx - alcove_width / 2, cy, wall_h / 2,
                wall_t, alcove_depth, wall_h))
            # Right wall
            segments.append(_wall_solid(
                f"deadend_{idx}_right", cx + alcove_width / 2, cy, wall_h / 2,
                wall_t, alcove_depth, wall_h))
        elif edge == "south":
            base_y = -half + 0.15
            cx, cy = lateral, base_y + alcove_depth / 2
            segments.append(_wall_solid(
                f"deadend_{idx}_back", cx, base_y, wall_h / 2,
                alcove_width, wall_t, wall_h))
            segments.append(_wall_solid(
                f"deadend_{idx}_left", cx - alcove_width / 2, cy, wall_h / 2,
                wall_t, alcove_depth, wall_h))
            segments.append(_wall_solid(
                f"deadend_{idx}_right", cx + alcove_width / 2, cy, wall_h / 2,
                wall_t, alcove_depth, wall_h))
        elif edge == "east":
            base_x = half - 0.15
            cx, cy = base_x - alcove_depth / 2, lateral
            segments.append(_wall_solid(
                f"deadend_{idx}_back", base_x, cy, wall_h / 2,
                wall_t, alcove_width, wall_h))
            segments.append(_wall_solid(
                f"deadend_{idx}_left", cx, cy - alcove_width / 2, wall_h / 2,
                alcove_depth, wall_t, wall_h))
            segments.append(_wall_solid(
                f"deadend_{idx}_right", cx, cy + alcove_width / 2, wall_h / 2,
                alcove_depth, wall_t, wall_h))
        else:  # west
            base_x = -half + 0.15
            cx, cy = base_x + alcove_depth / 2, lateral
            segments.append(_wall_solid(
                f"deadend_{idx}_back", base_x, cy, wall_h / 2,
                wall_t, alcove_width, wall_h))
            segments.append(_wall_solid(
                f"deadend_{idx}_left", cx, cy - alcove_width / 2, wall_h / 2,
                alcove_depth, wall_t, wall_h))
            segments.append(_wall_solid(
                f"deadend_{idx}_right", cx, cy + alcove_width / 2, wall_h / 2,
                alcove_depth, wall_t, wall_h))

        aabbs.append(AABB(cx, cy, alcove_width / 2 + wall_t,
                          alcove_depth / 2 + wall_t))
        idx += 1

    header = "# === DEAD-END ALCOVES ==="
    return header + "\n" + "\n\n".join(segments), aabbs


# ---- Obstacles ------------------------------------------------------------

def build_obstacles(size: float, count: int, rng: random.Random,
                    occupied: List[AABB]) -> str:
    """Place obstacles with overlap prevention and spawn-area exclusion."""
    half = size / 2.0
    margin = 0.3  # keep away from outer walls
    placed: list[str] = []
    placed_aabbs: list[AABB] = list(occupied)

    counters: dict[str, int] = {}
    max_attempts = count * 20  # safety valve
    attempts = 0

    while len(placed) < count and attempts < max_attempts:
        attempts += 1
        proto, z_off, size_spec = rng.choice(OBSTACLE_CATALOGUE)

        # Pick candidate position.
        x = rng.uniform(-half + margin, half - margin)
        y = rng.uniform(-half + margin, half - margin)

        if _near_origin(x, y):
            continue

        # Approximate bounding radius for overlap test.
        obj_half = 0.12  # conservative half-size for most obstacles
        candidate = AABB(x, y, obj_half, obj_half)
        if any(candidate.overlaps(a) for a in placed_aabbs):
            continue

        rot_angle = rng.uniform(0, 2 * math.pi)
        counters.setdefault(proto, 0)
        counters[proto] += 1
        name = f"{proto.lower()}_{counters[proto]}"

        size_line = f"  size {size_spec}\n" if size_spec else ""

        node = (
            f"{proto} {{\n"
            f"  translation {x:.3f} {y:.3f} {z_off}\n"
            f"  rotation 0 0 1 {rot_angle:.3f}\n"
            f"  name \"{name}\"\n"
            f"{size_line}"
            f"}}"
        )
        placed.append(node)
        placed_aabbs.append(candidate)

    header = "# === OBSTACLES ==="
    return header + "\n" + "\n\n".join(placed)


# ---- E-puck ---------------------------------------------------------------

def build_epuck() -> str:
    return textwrap.dedent("""\
        # === E-PUCK ===
        E-puck {
          translation 0 0 0
          rotation 0 0 1 0
          name "arena_robot"
          controller "arena_robot"
        }""")


# ---------------------------------------------------------------------------
# Main generation pipeline
# ---------------------------------------------------------------------------

def generate_world(size: float, seed: int, num_obstacles: int,
                   num_corridors: int = 0, num_dead_ends: int = 0) -> str:
    """Produce a complete .wbt file as a string."""
    rng = random.Random(seed)

    sections: list[str] = []
    sections.append(build_externprotos())
    sections.append(build_worldinfo(size))
    sections.append(build_viewpoint(size))
    sections.append(build_background())
    sections.append(build_rectangle_arena(size))

    terrain_text, terrain_aabbs = build_terrain_zones(size, rng)
    sections.append(terrain_text)

    walls_text, wall_aabbs = build_internal_walls(size, num_corridors, rng)
    if walls_text:
        sections.append(walls_text)

    dead_text, dead_aabbs = build_dead_ends(size, num_dead_ends, rng)
    if dead_text:
        sections.append(dead_text)

    # Obstacles sit on top of terrain, so only walls/dead-ends block placement.
    occupied = wall_aabbs + dead_aabbs
    sections.append(build_obstacles(size, num_obstacles, rng, occupied))
    sections.append(build_epuck())

    return "\n\n".join(sections) + "\n"


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _default_output_dir() -> Path:
    """worlds/ directory relative to *this script*."""
    return Path(__file__).resolve().parent.parent / "worlds"


def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate Webots .wbt arena files procedurally.",
    )
    parser.add_argument("--size", type=float, default=15,
                        help="Arena side length in metres (default: 15)")
    parser.add_argument("--seed", type=int, default=42,
                        help="Random seed (default: 42)")
    parser.add_argument("--obstacles", type=int, default=50,
                        help="Number of obstacles (default: 50)")
    parser.add_argument("--preset", choices=["easy", "medium", "hard"],
                        default=None,
                        help="Override size/obstacles with a preset")
    parser.add_argument("--output", type=str, default=None,
                        help="Output .wbt path (default: worlds/arena_<seed>.wbt)")
    parser.add_argument("--generate-variants", type=int, default=0,
                        metavar="N",
                        help="Generate N variants with incremented seeds")
    return parser.parse_args(argv)


def main(argv: Optional[list[str]] = None) -> None:
    args = parse_args(argv)

    size = args.size
    obstacles = args.obstacles
    corridors = 0
    dead_ends = 0

    if args.preset:
        p = PRESETS[args.preset]
        size = p["size"]
        obstacles = p["obstacles"]
        corridors = p["corridors"]
        dead_ends = p["dead_ends"]

    output_dir = _default_output_dir()
    output_dir.mkdir(parents=True, exist_ok=True)

    variant_count = max(1, args.generate_variants) if args.generate_variants else 1
    seeds = [args.seed + i for i in range(variant_count)]

    for seed in seeds:
        wbt = generate_world(size, seed, obstacles, corridors, dead_ends)

        if args.output and variant_count == 1:
            out_path = Path(args.output)
        else:
            out_path = output_dir / f"arena_{seed}.wbt"

        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(wbt, encoding="utf-8")
        print(f"Wrote {out_path}  (size={size}m, seed={seed}, "
              f"obstacles={obstacles}, corridors={corridors}, "
              f"dead_ends={dead_ends})")


if __name__ == "__main__":
    main()
