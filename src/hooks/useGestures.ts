import { useCallback, useRef, useState } from "react";
import { clamp } from "../utils/clamp";
import type { Direction, Orientation } from "../types";

type GestureState = {
  isDragging: boolean;
  start: number;
  last: number;
  delta: number;
  startTime: number;
};

type UseGesturesParams = {
  orientation: Orientation;
  direction: Direction;
  threshold: number;
  flickVelocity: number;
  lockAxis: boolean;
  ignoreWhileAnimating: boolean;
  loop: boolean;
  getIndex: () => number;
  maxIndex: number;
  onRequestIndexChange: (nextIndex: number) => void;
  setAnimating: (value: boolean) => void;
  isAnimating: boolean;
  onDragStart?: (evt: React.PointerEvent) => void;
  onDrag?: (delta: number, evt: React.PointerEvent) => void;
  onDragEnd?: () => void;
};

function primaryCoord(evt: PointerEvent | React.PointerEvent, orientation: Orientation) {
  return orientation === "vertical" ? evt.clientY : evt.clientX;
}

/**
 * Pointer/touch gestures (drag + flick). Mirrors the spec:
 * IDLE -> DRAGGING -> SETTLING with threshold + velocity decision.
 */
export function useGestures(params: UseGesturesParams) {
  const {
    orientation,
    direction,
    threshold,
    flickVelocity,
    lockAxis,
    ignoreWhileAnimating,
    loop,
    getIndex,
    maxIndex,
    onRequestIndexChange,
    setAnimating,
    isAnimating,
    onDragStart,
    onDrag,
    onDragEnd,
  } = params;

  const [isDragging, setIsDragging] = useState(false);
  const state = useRef<GestureState>({
    isDragging: false,
    start: 0,
    last: 0,
    delta: 0,
    startTime: 0,
  });

  const startDrag = useCallback((evt: React.PointerEvent) => {
    evt.currentTarget.setPointerCapture?.(evt.pointerId);
    const coord = primaryCoord(evt, orientation);
    state.current = {
      isDragging: true,
      start: coord,
      last: coord,
      delta: 0,
      startTime: performance.now(),
    };
    setIsDragging(true);
    onDragStart?.(evt);
  }, [orientation, onDragStart]);

  const updateDrag = useCallback((evt: React.PointerEvent) => {
    if (!state.current.isDragging) return;

    const coord = primaryCoord(evt, orientation);
    const delta = coord - state.current.start;
    state.current.delta = delta;
    state.current.last = coord;
    onDrag?.(delta, evt);
  }, [orientation, onDrag]);

  const endDrag = useCallback(() => {
    if (!state.current.isDragging) return;

    const now = performance.now();
    const duration = Math.max(now - state.current.startTime, 1);
    const distance = Math.abs(state.current.delta);
    const velocity = distance / duration; // px/ms

    const isForward = (() => {
      const raw = state.current.delta;
      if (orientation === "vertical") return raw < 0;
      // horizontal respects text direction
      const normalized = direction === "rtl" ? raw * -1 : raw;
      return normalized < 0;
    })();

    const current = getIndex();
    const deltaSign = isForward ? 1 : -1;
    const meetsFlick = velocity > flickVelocity;
    const meetsDistance = distance > threshold;

    let next = current;
    if (meetsFlick || meetsDistance) {
      next = current + deltaSign;
    }

    if (loop) {
      next = (next + (maxIndex + 1)) % (maxIndex + 1);
    } else {
      next = clamp(next, 0, maxIndex);
    }

    setAnimating(true);
    onRequestIndexChange(next);

    state.current.isDragging = false;
    state.current.delta = 0;
    setIsDragging(false);
    onDragEnd?.();
  }, [direction, flickVelocity, getIndex, maxIndex, onRequestIndexChange, orientation, loop, setAnimating, threshold, onDragEnd]);

  const cancelDrag = useCallback(() => {
    state.current.isDragging = false;
    state.current.delta = 0;
    setIsDragging(false);
  }, []);

  const onPointerDown = useCallback((evt: React.PointerEvent) => {
    if (ignoreWhileAnimating && isAnimating) return;
    if (evt.button !== 0) return;
    startDrag(evt);
  }, [ignoreWhileAnimating, isAnimating, startDrag]);

  const onPointerMove = useCallback((evt: React.PointerEvent) => {
    if (!lockAxis && !state.current.isDragging) return;
    if (state.current.isDragging) {
      updateDrag(evt);
    }
  }, [lockAxis, updateDrag]);

  const onPointerUp = useCallback(() => {
    endDrag();
  }, [endDrag]);

  const onPointerCancel = useCallback(() => {
    cancelDrag();
  }, [cancelDrag]);

  return {
    isDragging,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  };
}

