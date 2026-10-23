import { useCallback, useEffect, useRef } from "react";
import type { Direction, Orientation } from "../types";
import { WHEEL_MAX_DELTA_ACCUMULATION, WHEEL_MAX_VISUAL_DELTA } from "../constants";

export type UseWheelParams = {
  orientation: Orientation;
  direction: Direction;
  discretePaging: boolean;
  enabled?: boolean;
  canStart?: () => boolean;
  threshold: number;
  /** Quiet interval that separates wheel sequences, including momentum. */
  debounce: number;
  /** Optional minimum between commits; never rearms an ongoing sequence. */
  cooldown?: number;
  onRequestIndexChange: (delta: 1 | -1) => void;
  viewport: HTMLElement | null;
  onDragStart?: () => void;
  /** Total displacement since this sequence began, matching pointer dragging. */
  onDrag?: (delta: number) => void;
  onDragEnd?: () => void;
};

/** One sequence owns at most one page. Momentum extends the quiet deadline. */
export function useWheel(params: UseWheelParams) {
  const latest = useRef(params);
  latest.current = params;
  const state = useRef({ last: -Infinity, committedAt: -Infinity, consumed: false,
    tracking: false, rejected: false, total: 0, visual: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endPreview = useCallback(() => {
    const s = state.current;
    const tracking = s.tracking;
    s.tracking = false;
    s.total = s.visual = 0;
    if (tracking) latest.current.onDragEnd?.();
  }, []);
  const cancel = useCallback(() => {
    state.current.consumed = true;
    endPreview();
  }, [endPreview]);

  useEffect(() => { if (params.enabled === false) cancel(); }, [params.enabled, cancel]);
  useEffect(() => {
    const element = params.viewport;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      const p = latest.current, s = state.current;
      if (!p.discretePaging || p.enabled === false || event.ctrlKey || event.metaKey) return;
      if ((event.target as Element).closest?.('input,textarea,select,[contenteditable=true],[data-swipe-ignore],details[open]')) return;
      const primary = p.orientation === 'vertical' ? event.deltaY : event.deltaX;
      const cross = p.orientation === 'vertical' ? event.deltaX : event.deltaY;
      if (!Number.isFinite(primary) || !Number.isFinite(cross) || (!primary && !cross)) return;
      const now = performance.now(), quiet = Math.max(1, p.debounce);
      if (now - s.last >= quiet) {
        endPreview();
        s.consumed = false;
        s.rejected = Math.abs(cross) > Math.abs(primary);
      }
      s.last = now;
      if (timer.current !== null) clearTimeout(timer.current);
      // A committed sequence has no drag work left. This timer only settles a nudge.
      timer.current = s.tracking || !s.consumed ? setTimeout(endPreview, quiet) : null;
      if (s.rejected) return;
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
      if (s.consumed) return;
      if (p.canStart?.() === false || now - s.committedAt < (p.cooldown ?? 0)) {
        cancel();
        return;
      }
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2
        ? ((p.orientation === 'vertical' ? element.clientHeight : element.clientWidth)
          || (p.orientation === 'vertical' ? window.innerHeight : window.innerWidth)) : 1;
      const delta = primary * unit * (p.orientation === 'horizontal' && p.direction === 'rtl' ? -1 : 1);
      if (!delta) return;
      if (!s.tracking) { s.tracking = true; p.onDragStart?.(); }
      // Reversal subtracts from the preview; it does not open another sequence.
      s.total += Math.sign(delta) * Math.min(Math.abs(delta), WHEEL_MAX_DELTA_ACCUMULATION);
      s.visual += Math.sign(delta) * Math.min(Math.abs(delta), WHEEL_MAX_VISUAL_DELTA);
      p.onDrag?.(-s.visual);
      if (Math.abs(s.total) < p.threshold) return;
      const direction = s.total > 0 ? 1 : -1;
      s.consumed = true;
      s.tracking = false;
      s.total = s.visual = 0;
      s.committedAt = now;
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = null;
      p.onRequestIndexChange(direction);
    };
    const hidden = () => { if (document.hidden) cancel(); };
    element.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      element.removeEventListener('wheel', onWheel);
      window.removeEventListener('blur', cancel);
      document.removeEventListener('visibilitychange', hidden);
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, [params.viewport, cancel, endPreview]);
  return { cancel };
}
