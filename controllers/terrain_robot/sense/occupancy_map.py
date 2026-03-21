"""
Mapa de ocupacion 2D para navegacion del robot.
Mantiene grilla con celdas: UNKNOWN, FREE, OCCUPIED + tipo de terreno.
Se actualiza desde pose + sensores IR usando ray-casting.
"""

import math
from terrain_rules import SENSOR_ANGLES, ROBOT_GEOMETRY

# Cell states
UNKNOWN = 0
FREE = 1
OCCUPIED = 2

# IR sensor calibration
IR_MAX_RANGE = 0.07  # metros, rango efectivo de sensores IR
IR_DETECTION_THRESHOLD = 80  # valor por encima del cual hay obstaculo


class OccupancyMap:
    def __init__(self, width_m=3.0, height_m=3.0, resolution=0.05):
        """
        Args:
            width_m: ancho del arena en metros
            height_m: alto del arena en metros
            resolution: tamano de celda en metros (default 5cm)
        """
        self.width_m = width_m
        self.height_m = height_m
        self.resolution = resolution
        self.cols = int(width_m / resolution)
        self.rows = int(height_m / resolution)

        # Grid de estados (flat list for performance)
        self._grid = [UNKNOWN] * (self.rows * self.cols)
        # Grid de terreno (None = unknown)
        self._terrain = [None] * (self.rows * self.cols)

        # Offset: world (0,0) maps to grid center
        self._ox = width_m / 2.0   # world x offset
        self._oy = height_m / 2.0  # world y offset

        # Sensor angles in radians
        self._sensor_angles = {
            k: math.radians(v) for k, v in SENSOR_ANGLES.items()
        }

        # Stats
        self._updates = 0

    def _world_to_grid(self, wx, wy):
        """Convert world coordinates to grid (row, col). Returns None if out of bounds."""
        col = int((wx + self._ox) / self.resolution)
        row = int((wy + self._oy) / self.resolution)
        if 0 <= row < self.rows and 0 <= col < self.cols:
            return (row, col)
        return None

    def _grid_to_world(self, row, col):
        """Convert grid (row, col) to world center coordinates."""
        wx = col * self.resolution - self._ox + self.resolution / 2
        wy = row * self.resolution - self._oy + self.resolution / 2
        return (wx, wy)

    def _idx(self, row, col):
        """Flat index from (row, col)."""
        return row * self.cols + col

    def _ir_to_distance(self, value):
        """Convert IR sensor value to distance in meters.
        Returns None if no detection (value too low)."""
        if value < IR_DETECTION_THRESHOLD:
            return None  # nothing detected
        # Approximate inverse relationship
        # Higher value = closer. Map 80-4095 to IR_MAX_RANGE-0.005m
        clamped = min(value, 4095)
        ratio = (clamped - IR_DETECTION_THRESHOLD) / (4095 - IR_DETECTION_THRESHOLD)
        distance = IR_MAX_RANGE * (1.0 - ratio * 0.93)  # min ~0.005m
        return max(0.005, distance)

    def _bresenham_ray(self, r0, c0, r1, c1):
        """Yield grid cells along ray from (r0,c0) to (r1,c1) using Bresenham."""
        dr = abs(r1 - r0)
        dc = abs(c1 - c0)
        sr = 1 if r0 < r1 else -1
        sc = 1 if c0 < c1 else -1
        err = dc - dr
        r, c = r0, c0

        while True:
            yield (r, c)
            if r == r1 and c == c1:
                break
            e2 = 2 * err
            if e2 > -dr:
                err -= dr
                c += sc
            if e2 < dc:
                err += dc
                r += sr

    def update(self, pose, sensor_data):
        """Update map from current pose and sensor readings."""
        px, py, theta = pose["x"], pose["y"], pose["theta"]
        prox = sensor_data["proximidad"]
        terreno = sensor_data.get("terreno_detectado")

        robot_cell = self._world_to_grid(px, py)
        if robot_cell is None:
            return

        # Mark robot position as FREE + terrain
        r0, c0 = robot_cell
        idx = self._idx(r0, c0)
        self._grid[idx] = FREE
        if terreno:
            self._terrain[idx] = terreno

        # Process each IR sensor
        for sensor_name, angle_offset in self._sensor_angles.items():
            value = prox.get(sensor_name, 0)
            ray_angle = theta + angle_offset

            # Compute endpoint
            distance = self._ir_to_distance(value)
            if distance is not None:
                # Object detected at distance
                end_x = px + distance * math.cos(ray_angle)
                end_y = py + distance * math.sin(ray_angle)
            else:
                # No object: mark ray up to max range as free
                end_x = px + IR_MAX_RANGE * math.cos(ray_angle)
                end_y = py + IR_MAX_RANGE * math.sin(ray_angle)

            end_cell = self._world_to_grid(end_x, end_y)
            if end_cell is None:
                continue

            r1, c1 = end_cell

            # Trace ray: all cells along path are FREE
            cells = list(self._bresenham_ray(r0, c0, r1, c1))
            for r, c in cells[:-1]:  # all except endpoint
                if 0 <= r < self.rows and 0 <= c < self.cols:
                    cell_idx = self._idx(r, c)
                    if self._grid[cell_idx] == UNKNOWN:
                        self._grid[cell_idx] = FREE

            # Endpoint: OCCUPIED if detected, FREE otherwise
            if 0 <= r1 < self.rows and 0 <= c1 < self.cols:
                end_idx = self._idx(r1, c1)
                if distance is not None:
                    self._grid[end_idx] = OCCUPIED
                else:
                    if self._grid[end_idx] == UNKNOWN:
                        self._grid[end_idx] = FREE

        self._updates += 1

    def get_exploration_stats(self):
        """Return exploration statistics."""
        total = self.rows * self.cols
        free = sum(1 for s in self._grid if s == FREE)
        occupied = sum(1 for s in self._grid if s == OCCUPIED)
        explored = free + occupied
        unknown = total - explored

        frontiers = self._count_frontiers()

        return {
            "total_cells": total,
            "explored": explored,
            "explored_pct": round(explored / total * 100, 1),
            "free": free,
            "occupied": occupied,
            "unknown": unknown,
            "frontiers": frontiers,
            "updates": self._updates,
        }

    def _count_frontiers(self):
        """Count frontier cells (FREE cells adjacent to UNKNOWN)."""
        count = 0
        for r in range(self.rows):
            for c in range(self.cols):
                if self._grid[self._idx(r, c)] != FREE:
                    continue
                # Check 4-neighbors
                for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < self.rows and 0 <= nc < self.cols:
                        if self._grid[self._idx(nr, nc)] == UNKNOWN:
                            count += 1
                            break
        return count

    def get_frontiers(self, max_count=10):
        """Return list of frontier cell world coordinates (up to max_count)."""
        frontiers = []
        for r in range(self.rows):
            for c in range(self.cols):
                if self._grid[self._idx(r, c)] != FREE:
                    continue
                for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < self.rows and 0 <= nc < self.cols:
                        if self._grid[self._idx(nr, nc)] == UNKNOWN:
                            wx, wy = self._grid_to_world(r, c)
                            frontiers.append([round(wx, 2), round(wy, 2)])
                            break
                if len(frontiers) >= max_count:
                    break
            if len(frontiers) >= max_count:
                break
        return frontiers

    def get_compact_map(self):
        """Return compressed map representation for Claude (<500 tokens)."""
        stats = self.get_exploration_stats()
        frontiers = self.get_frontiers(max_count=8)

        # Collect occupied cells as coordinate pairs
        obstacles = []
        for r in range(self.rows):
            for c in range(self.cols):
                if self._grid[self._idx(r, c)] == OCCUPIED:
                    wx, wy = self._grid_to_world(r, c)
                    obstacles.append([round(wx, 2), round(wy, 2)])
        # Limit obstacles to keep token count low
        if len(obstacles) > 20:
            # Sample evenly
            step = len(obstacles) // 20
            obstacles = obstacles[::step][:20]

        # Terrain zones: aggregate terrain types into regions
        terrain_counts = {}
        for t in self._terrain:
            if t:
                terrain_counts[t] = terrain_counts.get(t, 0) + 1

        return {
            "size": f"{self.width_m}x{self.height_m}m",
            "resolution": f"{self.resolution}m",
            "explored_pct": stats["explored_pct"],
            "frontiers": frontiers,
            "obstacles_sample": obstacles,
            "terrain_zones": terrain_counts,
            "frontier_count": stats["frontiers"],
        }

    def __str__(self):
        """ASCII visualization of the map for debugging."""
        symbols = {UNKNOWN: ".", FREE: " ", OCCUPIED: "#"}
        lines = []
        for r in range(self.rows - 1, -1, -1):  # top to bottom
            row = ""
            for c in range(self.cols):
                state = self._grid[self._idx(r, c)]
                terrain = self._terrain[self._idx(r, c)]
                if terrain and state == FREE:
                    row += terrain[0].upper()  # M, S, C, R
                else:
                    row += symbols.get(state, "?")
            lines.append(row)
        return "\n".join(lines)
