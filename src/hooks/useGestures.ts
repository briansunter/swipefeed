import { useCallback, useRef, useState, useMemo } from "react";
import { clamp } from "../utils/clamp";
import type { Direction, Orientation } from "../types";

type UseGesturesParams = {
  orientation: Orientation;
  direction: Direction;
  threshold: number;
  flickVelocity: number;
  minFlickDistance?: number;
  distanceRatio?: number;
  viewportSize?: () => number;
  controlledTouch?: boolean;
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

type Sample = {position: number; time: number};
export function useGestures(params: UseGesturesParams) {
  const latest = useRef(params);
  latest.current = params;
  const [isDragging, setIsDragging] = useState(false);
  const state = useRef<{
    pointer: number; start: number; cross: number; delta: number;
    index: number; started: boolean; rejected: boolean; samples: Sample[];
  } | null>(null);
  const coord = (evt: React.PointerEvent, primary: boolean) =>
    (latest.current.orientation === "vertical") === primary ? evt.clientY : evt.clientX;

  const reset = useCallback(() => {
    if (!state.current) return;
    state.current = null;
    setIsDragging(false);
    latest.current.onDragEnd?.();
  }, []);

  const finish = useCallback((cancelled: boolean) => {
    const s = state.current, p = latest.current;
    if (!s) return;
    if (!s.started) { reset(); return; }
    const now = performance.now();
    // Recent movement matters. A fast drag followed by a hold is not a flick.
    const recent = s.samples.filter(v => now - v.time <= 100);
    const first = recent[0], last = recent.at(-1);
    const velocity = first && last && last.time > first.time
      ? (last.position - first.position) / (last.time - first.time) : 0;
    const distance = Math.abs(s.delta);
    const threshold = Math.max(p.threshold, (p.viewportSize?.() ?? 0) * (p.distanceRatio ?? 0));
    const flick = distance >= (p.minFlickDistance ?? 24)
      && Math.abs(velocity) >= p.flickVelocity && Math.sign(velocity) === Math.sign(s.delta);
    const forward = p.orientation === "horizontal" && p.direction === "rtl" ? s.delta > 0 : s.delta < 0;
    let next = s.index;
    if (!cancelled && !s.rejected && (distance >= threshold || flick)) next += forward ? 1 : -1;
    next = p.loop ? (next + p.maxIndex + 1) % (p.maxIndex + 1) : clamp(next, 0, p.maxIndex);
    reset();
    p.setAnimating(true);
    p.onRequestIndexChange(next);
  }, [reset]);

  const onPointerDown = useCallback((evt: React.PointerEvent) => {
    const p = latest.current;
    // Native touch and a JS pointer drag must never move the same viewport.
    if (evt.pointerType === "touch" && !p.controlledTouch) return;
    if (evt.isPrimary === false || evt.button !== 0 || state.current) return;
    if (p.ignoreWhileAnimating && p.isAnimating && !p.controlledTouch) return;
    if ((evt.target as Element).closest?.("a,button,input,textarea,select,summary,[contenteditable=true],[data-swipe-ignore]")) return;
    state.current = {pointer:evt.pointerId,start:coord(evt,true),cross:coord(evt,false),delta:0,
      index:p.getIndex(),started:false,rejected:false,samples:[{position:coord(evt,true),time:performance.now()}]};
  }, []);

  const onPointerMove = useCallback((evt: React.PointerEvent) => {
    const s = state.current, p = latest.current;
    if (!s || evt.pointerId !== s.pointer || s.rejected) return;
    const position = coord(evt,true), delta = position - s.start;
    if (!s.started) {
      const cross = Math.abs(coord(evt,false)-s.cross);
      if (Math.max(Math.abs(delta),cross) < 8) return;
      if (p.lockAxis && cross > Math.abs(delta)) { s.rejected=true; return; }
      s.started=true;
      evt.currentTarget.setPointerCapture?.(evt.pointerId);
      setIsDragging(true);
      p.onDragStart?.(evt);
    }
    s.delta=delta;
    const now=performance.now();
    s.samples.push({position,time:now});
    s.samples=s.samples.filter(v=>now-v.time<=120);
    if (evt.cancelable) evt.preventDefault();
    p.onDrag?.(delta,evt);
  }, []);
  const onPointerUp = useCallback((evt: React.PointerEvent) => {
    if (evt.pointerId === state.current?.pointer) finish(false);
  }, [finish]);
  const onPointerCancel = useCallback((evt: React.PointerEvent) => {
    if (evt.pointerId === state.current?.pointer) finish(true);
  }, [finish]);
  const onLostPointerCapture = useCallback((evt: React.PointerEvent) => {
    // Capturing the surface transfers implicit touch capture from its child.
    // That child loss bubbles here and must not cancel the new owner.
    if (evt.target === evt.currentTarget && evt.pointerId === state.current?.pointer) finish(true);
  }, [finish]);
  return useMemo(() => ({isDragging,reset,handlers:{onPointerDown,onPointerMove,onPointerUp,onPointerCancel,onLostPointerCapture}}),
    [isDragging,reset,onPointerDown,onPointerMove,onPointerUp,onPointerCancel,onLostPointerCapture]);
}
