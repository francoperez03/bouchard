import { useEffect, useRef } from "react";
import type { RobotState } from "../types/robot";
import type { EventEntry } from "../types/events";

export function useEventFeed(state: RobotState | null): EventEntry[] {
  const eventsRef = useRef<EventEntry[]>([]);
  const idRef = useRef(0);
  const isFirstRef = useRef(true);
  const prevRef = useRef({
    reflexDesc: "",
    strategyDesc: "",
    emergency: false,
    terrain: "",
  });

  useEffect(() => {
    if (!state) return;

    if (isFirstRef.current) {
      isFirstRef.current = false;
      prevRef.current = {
        reflexDesc: state.reflex.description,
        strategyDesc: state.strategy.description,
        emergency: state.reflex.emergency,
        terrain: state.sensors.terreno_detectado,
      };
      return;
    }

    const prev = prevRef.current;
    const push = (type: EventEntry["type"], message: string) => {
      eventsRef.current = [
        { id: ++idRef.current, timestamp: Date.now(), type, message },
        ...eventsRef.current,
      ].slice(0, 20);
    };

    if (state.reflex.emergency !== prev.emergency) {
      push(
        "emergency",
        state.reflex.emergency ? "Emergency triggered" : "Emergency cleared"
      );
    }

    if (state.reflex.description && state.reflex.description !== prev.reflexDesc) {
      push("reflex", state.reflex.description);
    }

    if (state.strategy.description && state.strategy.description !== prev.strategyDesc) {
      push("strategy", state.strategy.description);
    }

    if (state.sensors.terreno_detectado !== prev.terrain) {
      push("terrain", `Terrain: ${prev.terrain} → ${state.sensors.terreno_detectado}`);
    }

    prevRef.current = {
      reflexDesc: state.reflex.description,
      strategyDesc: state.strategy.description,
      emergency: state.reflex.emergency,
      terrain: state.sensors.terreno_detectado,
    };
  }, [state]);

  return eventsRef.current;
}
