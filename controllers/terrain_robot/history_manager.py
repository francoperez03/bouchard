"""
Compresion jerarquica de historial de sesion.
3 niveles: detalle reciente, resumen medio, estadisticas antiguas.
Presupuesto total: <300 tokens para Claude.
"""


class HistoryManager:
    """Manages session history with hierarchical compression."""

    def __init__(self, recent_limit=5, summary_limit=20):
        self._recent_limit = recent_limit
        self._summary_limit = summary_limit

        # Recent events (full detail)
        self._recent = []

        # Summary events (1-line each)
        self._summaries = []

        # Aggregate stats
        self._stats = {
            "terrains_visited": set(),
            "total_distance": 0.0,
            "total_steps": 0,
            "collisions": 0,
            "goals_completed": 0,
            "goals_failed": 0,
            "terrain_steps": {},  # terrain -> step count
        }

        self._last_pose = None
        self._last_terreno = None

    def record_step(self, data, action=""):
        """Record a single step. Called every N steps (not every step for efficiency)."""
        terreno = data.get("terreno_detectado", "")
        pose = data.get("pose", {})
        slip = data.get("slip_ratio", 0)

        # Update stats
        self._stats["total_steps"] += 1
        self._stats["terrains_visited"].add(terreno)
        self._stats["terrain_steps"][terreno] = self._stats["terrain_steps"].get(terreno, 0) + 1

        # Track distance
        if self._last_pose:
            dx = pose.get("x", 0) - self._last_pose.get("x", 0)
            dy = pose.get("y", 0) - self._last_pose.get("y", 0)
            self._stats["total_distance"] += (dx * dx + dy * dy) ** 0.5
        self._last_pose = dict(pose) if pose else None

        # Detect notable events
        event = None

        # Terrain change
        if terreno != self._last_terreno and self._last_terreno is not None:
            event = f"terrain: {self._last_terreno} -> {terreno}"
        self._last_terreno = terreno

        # Collision/emergency
        if "emergency" in action or "obstacle" in action:
            self._stats["collisions"] += 1
            event = f"collision at ({pose.get('x', 0):.1f}, {pose.get('y', 0):.1f})"

        # Goal events
        if "completed" in action.lower():
            self._stats["goals_completed"] += 1
            event = f"goal completed at ({pose.get('x', 0):.1f}, {pose.get('y', 0):.1f})"
        elif "failed" in action.lower() or "timeout" in action.lower():
            self._stats["goals_failed"] += 1
            event = f"goal failed at ({pose.get('x', 0):.1f}, {pose.get('y', 0):.1f})"

        # High slip
        if slip > 0.5:
            event = f"high slip ({slip:.1f}) on {terreno}"

        if event:
            self._add_event(event)

    def record_event(self, event_text):
        """Manually record a notable event."""
        self._add_event(event_text)

    def _add_event(self, event):
        """Add event to recent list, compress if needed."""
        self._recent.append(event)

        # If recent is full, move oldest to summaries
        while len(self._recent) > self._recent_limit:
            old = self._recent.pop(0)
            self._summaries.append(old)

        # If summaries is full, discard oldest (stats capture aggregate)
        while len(self._summaries) > self._summary_limit:
            self._summaries.pop(0)

    def get_compact_history(self):
        """Build compressed history for Claude. Target: <300 tokens."""
        parts = []

        # Stats block (~50 tokens)
        s = self._stats
        terrain_dist = ", ".join(f"{t}:{c}" for t, c in
                                 sorted(s["terrain_steps"].items(), key=lambda x: -x[1]))
        parts.append(
            f"Session: {s['total_steps']} steps, "
            f"{s['total_distance']:.1f}m traveled, "
            f"{s['collisions']} collisions, "
            f"{s['goals_completed']} goals OK, "
            f"{s['goals_failed']} goals failed. "
            f"Terrains: {terrain_dist}"
        )

        # Summaries (~100 tokens, 1-line each)
        if self._summaries:
            summary_text = "; ".join(self._summaries[-10:])  # last 10 summaries
            parts.append(f"Earlier: {summary_text}")

        # Recent events (~100 tokens, full detail)
        if self._recent:
            recent_text = "; ".join(self._recent)
            parts.append(f"Recent: {recent_text}")

        return "\n".join(parts)

    @property
    def token_estimate(self):
        """Rough token estimate for the compact history."""
        text = self.get_compact_history()
        return len(text) // 4  # rough estimate: 4 chars per token
