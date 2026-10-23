import { useCallback, useRef, useState, useMemo, useEffect } from "react";
import { clamp } from "../utils/clamp";
import type { Direction, Orientation } from "../types";

type UseGesturesParams = {
  enabled?:boolean;
  orientation: Orientation;
  direction: Direction;
  threshold: number;
  flickVelocity: number;
  minFlickDistance?: number;
  distanceRatio?: number;
  maxThreshold?: number;
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
type InputPoint = {clientX:number;clientY:number;timeStamp:number};
function inputTime(event:{timeStamp:number}) {
  const now=performance.now();
  let time=event.timeStamp;
  // WebKit versions may use epoch milliseconds instead of the performance clock.
  if(time>1e12)time-=performance.timeOrigin;
  return Number.isFinite(time)&&time>0&&time<=now+1000?time:now;
}
export function useGestures(params: UseGesturesParams) {
  const latest = useRef(params);
  latest.current = params;
  const [isDragging, setIsDragging] = useState(false);
  const state = useRef<{
    pointer: number; start: number; cross: number; delta: number;
    index: number; started: boolean; rejected: boolean; samples: Sample[];
  } | null>(null);
  const coord = (evt: InputPoint, primary: boolean) =>
    (latest.current.orientation === "vertical") === primary ? evt.clientY : evt.clientX;

  const reset = useCallback(() => {
    if (!state.current) return;
    state.current = null;
    setIsDragging(false);
    latest.current.onDragEnd?.();
  }, []);

  const finish = useCallback((cancelled: boolean, now=performance.now()) => {
    const s = state.current, p = latest.current;
    if (!s) return;
    if (!s.started) { reset(); return; }
    const last=s.samples.at(-1)!;
    const cutoff=now-100;
    let first=s.samples[0];
    let following:Sample|undefined;
    for(let i=1;i<s.samples.length;i++){
      if(s.samples[i].time<=cutoff)first=s.samples[i];
      else {following=s.samples[i];break;}
    }
    if(first.time<cutoff&&following&&following.time>first.time){
      const ratio=clamp((cutoff-first.time)/(following.time-first.time),0,1);
      first={position:first.position+(following.position-first.position)*ratio,time:cutoff};
    }
    // Use actual input timing and retain the last movement through a quick lift.
    // A stationary hold expires momentum; handler delays do not erase a flick.
    const velocity=now-last.time<120&&last.time>first.time
      ?(last.position-first.position)/(last.time-first.time):0;
    const distance = Math.abs(s.delta);
    const threshold = Math.min(p.maxThreshold??Infinity,
      Math.max(p.threshold, (p.viewportSize?.() ?? 0) * (p.distanceRatio ?? 0)));
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

  useEffect(()=>{if(params.enabled===false)finish(true);},[params.enabled,finish]);

  const onPointerDown = useCallback((evt: React.PointerEvent) => {
    const p = latest.current;
    // Native touch and a JS pointer drag must never move the same viewport.
    if(p.enabled===false)return;
    if (evt.pointerType === "touch" && !p.controlledTouch) return;
    if (evt.isPrimary === false || evt.button !== 0 || state.current) return;
    if (p.ignoreWhileAnimating && p.isAnimating && !p.controlledTouch) return;
    if ((evt.target as Element).closest?.("a,button,input,textarea,select,summary,[contenteditable=true],[data-swipe-ignore]")) return;
    state.current = {pointer:evt.pointerId,start:coord(evt,true),cross:coord(evt,false),delta:0,
      index:p.getIndex(),started:false,rejected:false,samples:[{position:coord(evt,true),time:inputTime(evt)}]};
  }, []);

  const updateDrag = useCallback((evt: React.PointerEvent, final=false) => {
    const s = state.current, p = latest.current;
    if (!s || evt.pointerId !== s.pointer || s.rejected) return;
    if(p.enabled===false){finish(true);return;}
    const position = coord(evt,true), delta = position - s.start;
    if (!s.started) {
      const cross = Math.abs(coord(evt,false)-s.cross);
      if (Math.max(Math.abs(delta),cross) < 8) return;
      if (p.lockAxis && cross > Math.abs(delta)) { s.rejected=true; return; }
      s.started=true;
      if(!final){try {evt.currentTarget.setPointerCapture?.(evt.pointerId);} catch {}}
      setIsDragging(true);
      p.onDragStart?.(evt);
    }
    s.delta=delta;
    const record=(point:InputPoint,stationary=false)=>{
      const time=inputTime(point),position=coord(point,true),last=s.samples.at(-1)!;
      if(time<last.time||(!stationary&&position===last.position))return;
      if(time===last.time)s.samples[s.samples.length-1]={position,time};
      else s.samples.push({position,time});
      while(s.samples.length>2&&s.samples[1].time<time-140)s.samples.shift();
      if(s.samples.length>64)s.samples.splice(1,s.samples.length-64);
    };
    const native=evt.nativeEvent??evt;
    for(const point of native.getCoalescedEvents?.()??[])record(point,true);
    record(evt,!final);
    if (evt.cancelable) evt.preventDefault();
    p.onDrag?.(delta,evt);
  }, []);
  const onPointerMove=useCallback((evt:React.PointerEvent)=>updateDrag(evt),[updateDrag]);
  const onPointerUp = useCallback((evt: React.PointerEvent) => {
    if (evt.pointerId !== state.current?.pointer)return;
    if(latest.current.enabled===false){finish(true,inputTime(evt));return;}
    // The final coordinate may be newer than every delivered pointermove.
    updateDrag(evt,true);
    finish(false,inputTime(evt));
  }, [finish,updateDrag]);
  const onPointerCancel = useCallback((evt: React.PointerEvent) => {
    if (evt.pointerId === state.current?.pointer) finish(true);
  }, [finish]);
  const onLostPointerCapture = useCallback((evt: React.PointerEvent) => {
    // Capturing the surface transfers implicit touch capture from its child.
    // That child loss bubbles here and must not cancel the new owner.
    if (evt.target === evt.currentTarget && evt.pointerId === state.current?.pointer) finish(true);
  }, [finish]);
  useEffect(() => {
    // Browser chrome and capture loss may route the end outside the deck.
    const up = (event: PointerEvent) => onPointerUp(event as unknown as React.PointerEvent);
    const cancel = () => finish(true);
    const hidden = () => { if (document.hidden) cancel(); };
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", onPointerCancel as unknown as EventListener);
    window.addEventListener("blur", cancel);
    window.addEventListener("pagehide", cancel);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", onPointerCancel as unknown as EventListener);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("pagehide", cancel);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [finish, onPointerUp, onPointerCancel]);
  const hasPointer = useCallback(() => state.current !== null, []);
  return useMemo(() => ({isDragging,reset,hasPointer,handlers:{onPointerDown,onPointerMove,onPointerUp,onPointerCancel,onLostPointerCapture}}),
    [isDragging,reset,hasPointer,onPointerDown,onPointerMove,onPointerUp,onPointerCancel,onLostPointerCapture]);
}
