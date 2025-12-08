// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWheel } from "../hooks/useWheel";

describe("useWheel", () => {
  it("triggers navigation when threshold reached", () => {
    const onRequestIndexChange = vi.fn();
    const { result } = renderHook(() =>
      useWheel({
        orientation: "vertical",
        direction: "ltr",
        discretePaging: true,
        threshold: 10,
        debounce: 50,
        onRequestIndexChange,
      }),
    );

    result.current.onWheel(new WheelEvent("wheel", { deltaY: 12 }) as unknown as React.WheelEvent);
    expect(onRequestIndexChange).toHaveBeenCalledWith(1);
  });
});

