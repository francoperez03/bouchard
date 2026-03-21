"""
Sistema de gestion de goals con maquina de estados.
Goals tienen ciclo de vida: PENDING -> ACTIVE -> COMPLETED/FAILED/TIMEOUT.
"""

from enum import Enum


class GoalState(Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"


class Goal:
    """Un objetivo de navegacion con estado y metadata."""

    def __init__(self, goal_type, x=None, y=None, reason="", priority=1,
                 timeout_steps=1000, **kwargs):
        self.type = goal_type  # explore, backtrack, patrol, investigate
        self.x = x
        self.y = y
        self.reason = reason
        self.priority = priority  # higher = more important
        self.timeout_steps = timeout_steps
        self.state = GoalState.PENDING
        self.start_step = 0
        self.end_step = 0
        self.progress = 0.0  # 0-1
        self.extra = kwargs  # patrol area coords, etc.

    def activate(self, step):
        self.state = GoalState.ACTIVE
        self.start_step = step

    def complete(self, step):
        self.state = GoalState.COMPLETED
        self.end_step = step

    def fail(self, step, reason=""):
        self.state = GoalState.FAILED
        self.end_step = step
        if reason:
            self.reason = f"{self.reason} | failed: {reason}"

    def timeout(self, step):
        self.state = GoalState.TIMEOUT
        self.end_step = step

    @property
    def has_coordinates(self):
        return self.x is not None and self.y is not None

    def __repr__(self):
        coords = f"({self.x}, {self.y})" if self.has_coordinates else "(no coords)"
        return f"Goal({self.type} {coords} [{self.state.value}] p={self.priority})"


class GoalManager:
    """Manages a queue of goals with state machine transitions."""

    REACH_THRESHOLD = 0.01  # squared distance (0.1m)
    NO_PROGRESS_LIMIT = 500  # steps without progress before FAILED

    def __init__(self):
        self._active = None  # current active Goal
        self._queue = []  # pending goals, sorted by priority
        self._completed = []  # history of completed/failed/timeout goals
        self._last_distance = None
        self._no_progress_steps = 0

    @property
    def active_goal(self):
        return self._active

    @property
    def stats(self):
        """Goal completion statistics."""
        total = len(self._completed)
        if total == 0:
            return {"total": 0, "completed": 0, "failed": 0, "timeout": 0, "rate": 0}
        completed = sum(1 for g in self._completed if g.state == GoalState.COMPLETED)
        failed = sum(1 for g in self._completed if g.state == GoalState.FAILED)
        timeout = sum(1 for g in self._completed if g.state == GoalState.TIMEOUT)
        return {
            "total": total,
            "completed": completed,
            "failed": failed,
            "timeout": timeout,
            "rate": round(completed / total, 2) if total else 0,
        }

    def add_goal(self, goal_type, x=None, y=None, reason="", priority=1,
                 timeout_steps=1000, **kwargs):
        """Add a new goal to the queue."""
        goal = Goal(goal_type, x=x, y=y, reason=reason, priority=priority,
                    timeout_steps=timeout_steps, **kwargs)
        self._queue.append(goal)
        self._queue.sort(key=lambda g: -g.priority)  # highest priority first
        print(f"[goals] Added: {goal}")
        return goal

    def set_goal_from_claude(self, goal_data, step):
        """Create and immediately activate a goal from Claude's tool call."""
        fn = goal_data.get("fn", "explore")
        args = goal_data.get("args", {})

        goal = Goal(
            goal_type=fn.replace("set_exploration_target", "explore"),
            x=args.get("x"),
            y=args.get("y"),
            reason=args.get("reason", ""),
            priority=2,  # Claude goals are high priority
            timeout_steps=1000,
            x1=args.get("x1"), y1=args.get("y1"),
            x2=args.get("x2"), y2=args.get("y2"),
        )

        # Deactivate current goal if any
        if self._active:
            self._active.fail(step, reason="replaced by new Claude goal")
            self._completed.append(self._active)
            print(f"[goals] Replaced: {self._active}")

        goal.activate(step)
        self._active = goal
        self._last_distance = None
        self._no_progress_steps = 0
        print(f"[goals] Activated: {goal}")
        return goal

    def update(self, pose, step, occ_map=None):
        """Update goal states. Call every step.
        Returns the active goal or None."""

        # If no active goal, try to activate from queue
        if not self._active and self._queue:
            self._active = self._queue.pop(0)
            self._active.activate(step)
            self._last_distance = None
            self._no_progress_steps = 0
            print(f"[goals] Activated from queue: {self._active}")

        if not self._active:
            return None

        goal = self._active

        # Check timeout
        if step - goal.start_step > goal.timeout_steps:
            goal.timeout(step)
            self._completed.append(goal)
            print(f"[goals] Timeout: {goal}")
            self._active = None
            return None

        # Check completion (position reached)
        if goal.has_coordinates:
            dx = goal.x - pose.get("x", 0)
            dy = goal.y - pose.get("y", 0)
            dist_sq = dx * dx + dy * dy

            if dist_sq < self.REACH_THRESHOLD:
                goal.complete(step)
                self._completed.append(goal)
                print(f"[goals] Completed: {goal} in {step - goal.start_step} steps")
                self._active = None
                return None

            # Track progress
            goal.progress = max(0, 1.0 - (dist_sq ** 0.5) / 3.0)  # rough estimate

            # No-progress detection
            if self._last_distance is not None:
                if dist_sq >= self._last_distance - 0.0001:
                    self._no_progress_steps += 1
                else:
                    self._no_progress_steps = 0

                if self._no_progress_steps > self.NO_PROGRESS_LIMIT:
                    goal.fail(step, reason="no progress")
                    self._completed.append(goal)
                    print(f"[goals] Failed (no progress): {goal}")
                    self._active = None
                    return None

            self._last_distance = dist_sq

        return goal

    def get_status_for_claude(self):
        """Return goal status summary for Claude's context."""
        s = self.stats
        result = {
            "goal_stats": s,
        }
        if self._active:
            result["active_goal"] = {
                "type": self._active.type,
                "progress": round(self._active.progress, 2),
                "steps_active": 0,  # will be filled by caller
            }
            if self._active.has_coordinates:
                result["active_goal"]["target"] = [self._active.x, self._active.y]
        result["queue_size"] = len(self._queue)
        return result

    def print_stats(self):
        s = self.stats
        print(f"[goals] {s['completed']}/{s['total']} completed "
              f"({s['rate']:.0%}), {s['failed']} failed, {s['timeout']} timeout")
