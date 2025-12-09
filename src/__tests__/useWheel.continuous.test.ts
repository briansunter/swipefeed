// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWheel } from "../hooks/useWheel";
import { useRef } from "react";

describe("useWheel continuous mode", () => {
  it("does not page when discretePaging=false", () => {
    const onRequestIndexChange = vi.fn();
    const element = document.createElement("div");

    renderHook(() => {
      const viewportRef = useRef<HTMLElement | null>(element);
      useWheel({
        orientation: "vertical",
        direction: "ltr",
        discretePaging: false,
        threshold: 10,
        debounce: 50,
        onRequestIndexChange,
        viewportRef,
      });
    });

    const event = new WheelEvent("wheel", { deltaY: 50 });
    Object.defineProperty(event, 'preventDefault', { value: vi.fn(), writable: true });

    element.dispatchEvent(event);

    expect(onRequestIndexChange).not.toHaveBeenCalled();
    // Should NOT call preventDefault in continuous/native mode
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
