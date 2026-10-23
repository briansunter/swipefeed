// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWheel } from "../hooks/useWheel";
import { useRef } from "react";

describe("useWheel", () => {
  it("triggers navigation when threshold reached", () => {
    const onRequestIndexChange = vi.fn();
    const element = document.createElement("div");

    renderHook(() => {
      const viewportRef = useRef<HTMLElement | null>(element);
      useWheel({
        orientation: "vertical",
        direction: "ltr",
        discretePaging: true,
        threshold: 10,
        debounce: 50,
        onRequestIndexChange,
        viewport: viewportRef.current,
      });
    });

    const event = new WheelEvent("wheel", { deltaY: 12, cancelable: true });
    // Mock preventDefault to check if it was called
    Object.defineProperty(event, 'preventDefault', { value: vi.fn(), writable: true });

    element.dispatchEvent(event);

    expect(onRequestIndexChange).toHaveBeenCalledWith(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });
});


it("keeps a wheel gesture listener stable while using the latest parent callbacks", () => {
  const element=document.createElement("div");
  const add=vi.spyOn(element,"addEventListener");
  const remove=vi.spyOn(element,"removeEventListener");
  const first=vi.fn(), second=vi.fn();
  const {rerender,unmount}=renderHook(({callback})=>useWheel({orientation:"vertical",direction:"ltr",discretePaging:true,threshold:35,debounce:100,viewport:element,onRequestIndexChange:callback,onDragEnd:()=>{}}),{initialProps:{callback:first}});
  element.dispatchEvent(new WheelEvent("wheel",{deltaY:20}));
  rerender({callback:second});
  expect(add.mock.calls.filter(c=>c[0]==="wheel")).toHaveLength(1);
  expect(remove.mock.calls.filter(c=>c[0]==="wheel")).toHaveLength(0);
  element.dispatchEvent(new WheelEvent("wheel",{deltaY:20}));
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledWith(1);
  unmount();
  expect(remove.mock.calls.filter(c=>c[0]==="wheel")).toHaveLength(1);
});

// A trackpad fling can deliver momentum for seconds after the first page commits.
import { afterEach } from 'vitest';
import { act, cleanup } from '@testing-library/react';
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks()});
function sequence(options: Partial<Parameters<typeof useWheel>[0]> = {}) {
 vi.useFakeTimers();vi.spyOn(performance,'now').mockImplementation(()=>Date.now());
 const viewport=document.createElement('div'), change=vi.fn(), drag=vi.fn(), end=vi.fn();
 const hook=renderHook(()=>useWheel({orientation:'vertical',direction:'ltr',discretePaging:true,threshold:35,debounce:220,cooldown:0,viewport,onRequestIndexChange:change,onDrag:drag,onDragEnd:end,...options}));
 const wheel=(y:number,ms=16,extra:WheelEventInit={})=>{act(()=>vi.advanceTimersByTime(ms));act(()=>viewport.dispatchEvent(new WheelEvent('wheel',{deltaY:y,bubbles:true,cancelable:true,...extra})));};
 return {wheel,change,drag,end,...hook};
}
it('one long fling including late noisy momentum commits only one page',()=>{
 const {wheel,change,end}=sequence({cooldown:650});wheel(50);
 for(let i=0;i<130;i++)wheel(i%17===0?-3:Math.max(1,30-i/5),16);
 act(()=>vi.advanceTimersByTime(1000));expect(change.mock.calls).toEqual([[1]]);expect(end).not.toHaveBeenCalled();
});
it('rearms after quiet without requiring a fixed cooldown',()=>{
 const {wheel,change}=sequence();wheel(40);wheel(2,80);wheel(40,240);wheel(-40,240);
 expect(change.mock.calls).toEqual([[1],[1],[-1]]);
});
it('reports total preview displacement, then returns an uncommitted nudge once',()=>{
 const {wheel,drag,end,change}=sequence();wheel(8);wheel(9);wheel(10);
 expect(drag.mock.calls.map(c=>c[0])).toEqual([-8,-17,-27]);act(()=>vi.advanceTimersByTime(300));expect(end).toHaveBeenCalledTimes(1);expect(change).not.toHaveBeenCalled();
});
it('pinch zoom and cross-axis gestures cannot become feed navigation',()=>{
 const {wheel,change,drag}=sequence();wheel(100,16,{ctrlKey:true});wheel(100,300,{deltaX:200});wheel(10,16,{deltaX:100});
 act(()=>vi.advanceTimersByTime(300));expect(change).not.toHaveBeenCalled();expect(drag).not.toHaveBeenCalled();
});
it('normalizes mouse line and page units and still consumes each burst once',()=>{
 const {wheel,change}=sequence();wheel(3,16,{deltaMode:1});wheel(3);wheel(-1,300,{deltaMode:2});expect(change.mock.calls).toEqual([[1],[-1]]);
});

it('consumes wheel input while a pointer owns the surface, including its remaining tail',()=>{
 let available=false;const {wheel,change}=sequence({canStart:()=>available});wheel(50);available=true;wheel(50,50);expect(change).not.toHaveBeenCalled();wheel(50,240);expect(change.mock.calls).toEqual([[1]]);
});
it('does not page or prevent native input when disabled',()=>{
 const {wheel,change,drag}=sequence({enabled:false});wheel(120);expect(change).not.toHaveBeenCalled();expect(drag).not.toHaveBeenCalled();
});
it('cancelling an unfinished wheel preview settles once and consumes its tail',()=>{
 const {wheel,change,end,result}=sequence();wheel(10);act(()=>result.current.cancel());wheel(40,30);expect(end).toHaveBeenCalledTimes(1);expect(change).not.toHaveBeenCalled();wheel(40,240);expect(change.mock.calls).toEqual([[1]]);
});
