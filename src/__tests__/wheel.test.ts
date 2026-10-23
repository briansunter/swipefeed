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

    const event = new WheelEvent("wheel", { deltaY: 12 });
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
