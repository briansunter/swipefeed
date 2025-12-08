import { useCallback, useRef } from "react";
import type { Direction, Orientation } from "../types";

type UseWheelParams = {
  orientation: Orientation;
  direction: Direction;
  discretePaging: boolean;
  threshold: number;
  debounce: number;
  onRequestIndexChange: (delta: 1 | -1) => void;
};

/**
 * Wheel handler supporting discrete paging (TikTok-like) or continuous mode.
 */
export function useWheel(params: UseWheelParams) {
  const { orientation, direction, discretePaging, threshold, debounce, onRequestIndexChange } = params;
  const accumulated = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetAccumulated = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      accumulated.current = 0;
    }, debounce);
  }, [debounce]);

  const onWheel = useCallback(
    (evt: React.WheelEvent) => {
      if (!discretePaging) return; // allow native scroll; index derived elsewhere

      evt.preventDefault();
      const rawDelta = orientation === "vertical" ? evt.deltaY : evt.deltaX;
      // RTL flips horizontal direction
      const adjusted = orientation === "horizontal" && direction === "rtl" ? -rawDelta : rawDelta;

      accumulated.current += adjusted;
      resetAccumulated();

      if (Math.abs(accumulated.current) >= threshold) {
        const delta: 1 | -1 = accumulated.current > 0 ? 1 : -1;
        accumulated.current = 0;
        onRequestIndexChange(delta);
      }
    },
    [direction, discretePaging, onRequestIndexChange, orientation, threshold, resetAccumulated],
  );

  return { onWheel };
}

