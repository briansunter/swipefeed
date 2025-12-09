import { useCallback, useRef, useEffect } from "react";
import type { Direction, Orientation } from "../types";

export type UseWheelParams = {
  orientation: Orientation;
  direction: Direction;
  discretePaging: boolean;
  threshold: number;
  debounce: number;
  cooldown?: number; // Cooldown period after navigation (ms)
  onRequestIndexChange: (delta: 1 | -1) => void;
  viewport: HTMLElement | null;
};

/**
 * Wheel handler supporting discrete paging (TikTok-like) or continuous mode.
 * 
 * Aggressively prevents multi-video scrolling:
 * - Long cooldown period after each navigation (600ms)
 * - Capped delta per event to prevent large jumps
 * - Direction locking during a scroll gesture
 * - Heavy velocity dampening for trackpad momentum
 */
export function useWheel(params: UseWheelParams) {
  const {
    orientation,
    direction,
    discretePaging,
    threshold,
    debounce,
    cooldown = 800, // 800ms cooldown - reduced double triggers
    onRequestIndexChange,
    viewport
  } = params;

  const accumulated = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastNavigationTime = useRef(0);
  const isInCooldown = useRef(false);
  const lastEventTime = useRef(0);
  const gestureDirection = useRef<1 | -1 | null>(null);
  const eventCount = useRef(0);

  // Maximum delta per single wheel event (allows normal scroll wheels, dampens trackpad flicks)
  const MAX_DELTA_PER_EVENT = 60;
  // Maximum accumulated value (prevents buildup during cooldown exit)
  const MAX_ACCUMULATED = threshold * 2;

  const resetAccumulated = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      accumulated.current = 0;
      gestureDirection.current = null;
      eventCount.current = 0;
    }, debounce);
  }, [debounce]);

  useEffect(() => {
    const element = viewport;
    if (!element) return;

    const onWheel = (evt: WheelEvent) => {
      if (!discretePaging) return; // allow native scroll; index derived elsewhere

      evt.preventDefault();
      evt.stopPropagation();

      const now = performance.now();

      // Strict cooldown check - completely ignore events during cooldown
      if (isInCooldown.current) {
        const timeSinceNav = now - lastNavigationTime.current;
        if (timeSinceNav < cooldown) {
          // Still in cooldown, ignore everything and keep accumulation at zero
          accumulated.current = 0;
          gestureDirection.current = null;
          eventCount.current = 0;
          return;
        }
        isInCooldown.current = false;
      }

      const rawDelta = orientation === "vertical" ? evt.deltaY : evt.deltaX;
      // RTL flips horizontal direction
      const adjusted = orientation === "horizontal" && direction === "rtl" ? -rawDelta : rawDelta;

      // Determine scroll direction
      const currentDirection: 1 | -1 = adjusted > 0 ? 1 : -1;

      // Direction locking: if user changes direction mid-gesture, reset
      if (gestureDirection.current !== null && gestureDirection.current !== currentDirection) {
        accumulated.current = 0;
        eventCount.current = 0;
      }
      gestureDirection.current = currentDirection;

      // Calculate time since last event
      const timeDelta = now - lastEventTime.current;
      lastEventTime.current = now;
      eventCount.current++;

      // Clamp individual delta to prevent large jumps from trackpad momentum
      const clampedDelta = Math.sign(adjusted) * Math.min(Math.abs(adjusted), MAX_DELTA_PER_EVENT);

      // Additional dampening for rapid successive events (trackpad momentum)
      // Only dampen after the 3rd rapid event to allow normal wheel scrolling
      let dampedDelta = clampedDelta;
      if (timeDelta > 0 && timeDelta < 16 && eventCount.current > 3) {
        // Very rapid events after initial scroll - apply progressive dampening
        const dampeningFactor = Math.max(0.2, 1 - ((eventCount.current - 3) * 0.1));
        dampedDelta = clampedDelta * dampeningFactor;
      }

      accumulated.current += dampedDelta;

      // Cap accumulated value to prevent over-accumulation
      accumulated.current = Math.sign(accumulated.current) *
        Math.min(Math.abs(accumulated.current), MAX_ACCUMULATED);

      resetAccumulated();

      if (Math.abs(accumulated.current) >= threshold) {
        const delta: 1 | -1 = accumulated.current > 0 ? 1 : -1;

        // Reset everything
        accumulated.current = 0;
        gestureDirection.current = null;
        eventCount.current = 0;

        // Set cooldown
        lastNavigationTime.current = now;
        isInCooldown.current = true;

        onRequestIndexChange(delta);
      }
    };

    // Passive: false is required to preventDefault
    element.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      element.removeEventListener("wheel", onWheel);
    };
  }, [
    orientation,
    direction,
    discretePaging,
    threshold,
    debounce,
    cooldown,
    onRequestIndexChange,
    resetAccumulated,
    viewport // Dependency for ref attachment
  ]);
}

