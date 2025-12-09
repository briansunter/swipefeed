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

