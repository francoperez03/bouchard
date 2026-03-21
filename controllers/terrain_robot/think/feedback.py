"""
Tracking de resultados de ejecucion de planes.
Alimenta feedback a Claude para que ajuste su estrategia.
"""


class FeedbackTracker:
    """Tracks plan execution outcomes and builds feedback for Claude."""

    def __init__(self):
        self._history = []  # list of outcome dicts
        self._max_history = 20
        self._current_plan = None
        self._plan_start_step = 0
        self._plan_start_pose = None
        self._consecutive_failures = 0

    def start_plan(self, goal_type, target_x=None, target_y=None, step=0, pose=None):
        """Register start of a new plan execution."""
        self._current_plan = {
            "goal_type": goal_type,
            "target": [target_x, target_y] if target_x is not None else None,
            "start_step": step,
        }
        self._plan_start_step = step
        self._plan_start_pose = dict(pose) if pose else {"x": 0, "y": 0, "theta": 0}

    def end_plan(self, outcome, step=0, pose=None, reason=""):
        """Record plan outcome. outcome: 'success', 'partial', 'failed', 'timeout'."""
        if not self._current_plan:
            return

        current_pose = pose or {"x": 0, "y": 0, "theta": 0}
        start_pose = self._plan_start_pose or {"x": 0, "y": 0, "theta": 0}

        dx = current_pose.get("x", 0) - start_pose.get("x", 0)
        dy = current_pose.get("y", 0) - start_pose.get("y", 0)
        distance = (dx * dx + dy * dy) ** 0.5

        result = {
            "goal_type": self._current_plan["goal_type"],
            "target": self._current_plan["target"],
            "outcome": outcome,
            "reason": reason,
            "steps_taken": step - self._plan_start_step,
            "distance_traveled": round(distance, 3),
        }

        # Track progress toward target if applicable
        if self._current_plan["target"]:
            tx, ty = self._current_plan["target"]
            remaining = ((tx - current_pose.get("x", 0)) ** 2 +
                         (ty - current_pose.get("y", 0)) ** 2) ** 0.5
            start_dist = ((tx - start_pose.get("x", 0)) ** 2 +
                          (ty - start_pose.get("y", 0)) ** 2) ** 0.5
            progress = 1.0 - (remaining / start_dist) if start_dist > 0.01 else 0
            result["progress"] = round(max(0, min(1, progress)), 2)

        self._history.append(result)
        if len(self._history) > self._max_history:
            self._history.pop(0)

        # Track consecutive failures
        if outcome in ("failed", "timeout"):
            self._consecutive_failures += 1
        else:
            self._consecutive_failures = 0

        self._current_plan = None
        print(f"[feedback] Plan ended: {result['goal_type']} -> {outcome} "
              f"({result['steps_taken']} steps, {result['distance_traveled']}m)")

    def get_feedback_for_claude(self):
        """Build feedback JSON for Claude's next call."""
        if not self._history:
            return None

        last = self._history[-1]

        # Compute session success rate
        total = len(self._history)
        successes = sum(1 for h in self._history if h["outcome"] == "success")
        rate = round(successes / total, 2) if total > 0 else 0

        feedback = {
            "last_plan": {
                "goal_type": last["goal_type"],
                "outcome": last["outcome"],
                "reason": last.get("reason", ""),
                "steps_taken": last["steps_taken"],
                "progress": last.get("progress", 0),
            },
            "session": {
                "plans_total": total,
                "success_rate": rate,
                "consecutive_failures": self._consecutive_failures,
            },
        }

        if self._consecutive_failures >= 3:
            feedback["alert"] = "repeated_failure"

        return feedback

    @property
    def stats(self):
        total = len(self._history)
        if total == 0:
            return {"total": 0, "success": 0, "failed": 0, "rate": 0}
        success = sum(1 for h in self._history if h["outcome"] == "success")
        failed = sum(1 for h in self._history if h["outcome"] in ("failed", "timeout"))
        return {
            "total": total,
            "success": success,
            "failed": failed,
            "rate": round(success / total, 2) if total else 0,
        }

    def print_stats(self):
        s = self.stats
        print(f"[feedback] {s['success']}/{s['total']} plans succeeded "
              f"({s['rate']:.0%}), {s['failed']} failed")
