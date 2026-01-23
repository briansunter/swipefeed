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
  onDragStart?: () => void;
  onDrag?: (delta: number) => void;
  onDragEnd?: () => void;
};

/**
 * Wheel handler supporting discrete paging (TikTok-like) or continuous tracking.
 * 
 * Aggressively prevents multi-video scrolling:
 * - Long cooldown period after each navigation
 * - Capped delta per event to prevent large jumps (smooths jerky mouse wheels)
 * - Direction locking during a scroll gesture
 */
export function useWheel(params: UseWheelParams) {
  const {
    orientation,
    direction,
    discretePaging,
    threshold,
    debounce,
    cooldown = 500,
    onRequestIndexChange,
    viewport,
    onDragStart,
    onDrag,
    onDragEnd,
  } = params;

  const accumulated = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastNavigationTime = useRef(0);
  const isInCooldown = useRef(false);
  const lastEventTime = useRef(0);
  const gestureDirection = useRef<1 | -1 | null>(null);
  const eventCount = useRef(0);
  const isTracking = useRef(false);
  const velocityRef = useRef(0);

  // Maximum delta per single wheel event for ACCUMULATION (triggering the swap)
  // We allow a reasonable amount so fast scrolls work, but dampen insane values
  const MAX_DELTA_ACCUMULATION = 120;

  // Maximum delta per single wheel event for VISUAL DRAG
  // This is the key to fixing "jerky" mouse wheel.
  // If we receive a 100px mouse wheel event, we clamp the visual drag to ~30px
  // so it looks like a smooth nudge rather than a teleport.
  // Continuous trackpad events (usually < 20px) pass through untouched.
  const MAX_VISUAL_DELTA = 40;

  const endGesture = useCallback(() => {
    isTracking.current = false;
    accumulated.current = 0;
    gestureDirection.current = null;
    eventCount.current = 0;
    velocityRef.current = 0;
    onDragEnd?.();
  }, [onDragEnd]);

  const resetAccumulated = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      endGesture();
    }, debounce);
  }, [debounce, endGesture]);

  useEffect(() => {
    const element = viewport;
    if (!element) return;

    const onWheel = (evt: WheelEvent) => {
      if (!discretePaging) return;

      evt.preventDefault();
      evt.stopPropagation();

      const now = performance.now();

      // Strict cooldown check
      if (isInCooldown.current) {
        if (now - lastNavigationTime.current < cooldown) {
          if (isTracking.current) endGesture();
          return;
        }
        isInCooldown.current = false;
      }

      const rawDelta = orientation === "vertical" ? evt.deltaY : evt.deltaX;
      // RTL flips horizontal direction
      const adjusted = orientation === "horizontal" && direction === "rtl" ? -rawDelta : rawDelta;

      // Determine scroll direction
      const currentDirection: 1 | -1 = adjusted > 0 ? 1 : -1;

      // Direction locking: reset if direction changes
      if (gestureDirection.current !== null && gestureDirection.current !== currentDirection) {
        accumulated.current = 0;
        eventCount.current = 0;
      }
      gestureDirection.current = currentDirection;

      if (!isTracking.current) {
        isTracking.current = true;
        onDragStart?.();
      }

      // Calculate time since last event
      const timeDelta = now - lastEventTime.current;
      lastEventTime.current = now;
      eventCount.current++;

      // 1. Calculate delta for ACCUMULATION (Threshold Check)
      // Allow fairly large steps so mouse wheel (100) triggers threshold quickly if repeated
      const accumDelta = Math.sign(adjusted) * Math.min(Math.abs(adjusted), MAX_DELTA_ACCUMULATION);

      // 2. Calculate delta for VISUAL DRAG (Smoothing)
      // Cap at MAX_VISUAL_DELTA so 100px jumps become 40px nudges
      const visualDelta = Math.sign(adjusted) * Math.min(Math.abs(adjusted), MAX_VISUAL_DELTA);

      // Flick detection velocity
      const instantVelocity = (timeDelta > 0 && timeDelta < 100) ? Math.abs(accumDelta / timeDelta) : 0;
      velocityRef.current = velocityRef.current * 0.8 + instantVelocity * 0.2;

      accumulated.current += accumDelta;

      // Visual Tracking: Move the slide, but smoothed
      onDrag?.(-visualDelta);

      resetAccumulated();

      const matchesThreshold = Math.abs(accumulated.current) >= threshold;
      const isFlick = velocityRef.current > 1.2 && Math.abs(accumulated.current) > 20;

      if (matchesThreshold || isFlick) {
        const navDelta: 1 | -1 = accumulated.current > 0 ? 1 : -1;

        // Reset tracking state without calling onDragEnd
        // onDragEnd is for when gesture ends WITHOUT navigation (snap back)
        // Here we ARE navigating, so we skip onDragEnd to avoid a competing snap navigation
        isTracking.current = false;
        accumulated.current = 0;
        gestureDirection.current = null;
        eventCount.current = 0;
        velocityRef.current = 0;

        lastNavigationTime.current = now;
        isInCooldown.current = true;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        onRequestIndexChange(navDelta);
      }
    };

    element.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      element.removeEventListener("wheel", onWheel);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [
    orientation,
    direction,
    discretePaging,
    threshold,
    // debounce, // REMOVED: Used in resetAccumulated, not here directly
    cooldown,
    onRequestIndexChange,
    resetAccumulated,
    viewport,
    endGesture,
    onDragStart,
    onDrag
  ]);
}
