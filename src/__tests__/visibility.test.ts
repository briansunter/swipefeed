// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useVisibility } from "../hooks/useVisibility";

describe("useVisibility", () => {
  it("selects top entry via intersection strategy", () => {
    const onActive = vi.fn();
    const { result } = renderHook(() =>
      useVisibility({
        itemCount: 2,
        getItemOffset: i => i * 100,
        getItemSize: () => 100,
        strategy: "intersection",
        intersectionRatio: 0.6,
        debounceMs: 0,
        onActive,
      }),
    );
    result.current.handleIntersection([
      { index: 0, ratio: 0.5 },
      { index: 1, ratio: 0.8 },
    ]);
    expect(onActive).toHaveBeenCalledWith(1);
  });

  it("selects closest item by position", () => {
    vi.useFakeTimers();
    const onActive = vi.fn();
    const offsets = Array.from({ length: 3 }, (_, i) => i * 600);
    const sizes = Array.from({ length: 3 }, () => 600);

    const { result } = renderHook(() =>
      useVisibility({
        itemCount: 3,
        getItemOffset: i => offsets[i],
        getItemSize: i => sizes[i],
        strategy: "position",
        intersectionRatio: 0.6,
        debounceMs: 0,
        onActive,
      }),
    );

    result.current.calculateFromPosition(650, 600); // center near item 1
    vi.runAllTimers();
    expect(onActive).toHaveBeenCalledWith(1);
    vi.useRealTimers();
  });
});

