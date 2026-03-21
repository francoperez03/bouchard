"""
Capa estrategica: gestiona llamadas a Claude y traduce goals a navegacion.
Se actualiza periodicamente. Usa GoalManager para ciclo de vida de goals.
"""

import math
from goal_manager import GoalManager
from feedback import FeedbackTracker
from history_manager import HistoryManager


class StrategyResult:
    """Resultado de la evaluacion estrategica."""
    __slots__ = ("has_action", "target_heading", "target_speed", "description")

    def __init__(self, has_action=False, target_heading=None, target_speed=None,
                 description=""):
        self.has_action = has_action
        self.target_heading = target_heading
        self.target_speed = target_speed
        self.description = description


class StrategyLayer:
    def __init__(self, ask_claude_fn, claude_available, max_calls=200,
                 call_interval=300):
        self._ask_claude = ask_claude_fn
        self._available = claude_available
        self._max_calls = max_calls
        self._call_interval = call_interval
        self._calls = 0
        self._last_terreno = ""
        self._goals = GoalManager()
        self._feedback = FeedbackTracker()
        self._history = HistoryManager()

    @property
    def claude_calls(self):
        return self._calls

    @property
    def goal_stats(self):
        return self._goals.stats

    def print_goal_stats(self):
        self._goals.print_stats()

    def print_feedback_stats(self):
        self._feedback.print_stats()

    def record_step(self, data, action=""):
        """Delegate to HistoryManager for session history recording."""
        self._history.record_step(data, action)

    def _compute_heading_to_target(self, pose, target_x, target_y):
        """Compute required turn angle to face target from current pose."""
        dx = target_x - pose.get("x", 0)
        dy = target_y - pose.get("y", 0)
        target_angle = math.atan2(dy, dx)
        current_angle = pose.get("theta", 0)
        diff = target_angle - current_angle
        while diff > math.pi:
            diff -= 2 * math.pi
        while diff < -math.pi:
            diff += 2 * math.pi
        return math.degrees(diff)

    def _needs_claude(self, data):
        """Determine if we should call Claude for a new strategy."""
        if self._goals.active_goal is None:
            return True
        terreno = data.get("terreno_detectado", "")
        if terreno != self._last_terreno:
            return True
        return False

    def update(self, data, step_count, map_data=None):
        """Evaluate strategy and return navigation result."""
        pose = data.get("pose", {})

        # Capture previous goal state before update
        prev_goal = self._goals.active_goal
        prev_goal_state = prev_goal.state if prev_goal else None

        # Update goal manager (checks completion/timeout/progress)
        self._goals.update(pose, step_count)

        # Detect goal state transitions and record feedback
        current_goal = self._goals.active_goal
        if prev_goal and prev_goal != current_goal:
            outcome_map = {"completed": "success", "failed": "failed",
                           "timeout": "timeout"}
            outcome = outcome_map.get(prev_goal.state.value, "partial")
            self._feedback.end_plan(outcome, step=step_count, pose=pose,
                                    reason=getattr(prev_goal, 'reason', ''))
            # Record goal transition in session history
            self._history.record_event(
                f"goal {prev_goal.type} {outcome} at step {step_count}"
            )

        # Determine if Claude should be called
        should_call = (
            self._available
            and self._calls < self._max_calls
            and step_count > 0
            and step_count % self._call_interval == 0
            and self._needs_claude(data)
        )

        if should_call:
            try:
                self._calls += 1
                print(f"\n[strategy] Claude call #{self._calls}/{self._max_calls}")

                feedback = self._feedback.get_feedback_for_claude()
                session_history = self._history.get_compact_history()
                plan = self._ask_claude(
                    data, history=None, current_step=step_count,
                    map_data=map_data, feedback=feedback,
                    session_history=session_history
                )

                if plan and "goal" in plan:
                    goal = self._goals.set_goal_from_claude(plan["goal"], step_count)
                    if goal:
                        self._feedback.start_plan(
                            goal.type, target_x=goal.x, target_y=goal.y,
                            step=step_count, pose=pose
                        )
                    self._last_terreno = data.get("terreno_detectado", "")

            except Exception as e:
                print(f"[strategy] Error: {e}")

        # Navigate toward active goal
        goal = self._goals.active_goal
        if goal and goal.has_coordinates:
            heading = self._compute_heading_to_target(pose, goal.x, goal.y)
            if abs(heading) > 20:
                return StrategyResult(
                    has_action=True,
                    target_heading=heading,
                    target_speed=40,
                    description=f"turning toward {goal.type} goal"
                )
            else:
                return StrategyResult(
                    has_action=True,
                    target_speed=50,
                    description=f"advancing to {goal.type} goal"
                )

        return StrategyResult()
