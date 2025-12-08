import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useVirtualizer } from "../hooks/useVirtualizer";
import { Virtualizer } from "@tanstack/virtual-core";

describe("useVirtualizer", () => {
  it("computes virtual items for native mode (simple pass-through)", () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ id: i }));
    const { result } = renderHook(() =>
      useVirtualizer({
        items,
        virtual: { estimatedSize: 100 },
        resolvedMode: "native",
        getScrollElement: () => document.createElement('div'),
      })
    );

    const offsets = result.current.virtualItems.map(v => v.offset);
    expect(offsets).toEqual([0, 100, 200, 300, 400, 500, 600, 700, 800, 900]);
    expect(result.current.totalSize).toBe(1000);
  });

  it("computes virtual items for virtualized mode", () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));

    // We need to mock Virtualizer behavior or just assert the integration logic.
    // Since we are using the real class, we might need a real DOM element or mock element.
    const container = document.createElement("div");

    // We can't easily test 'scroll' without mocking Virtualizer internals extensively because 
    // jsdom doesn't do layout.
    // But we can check if it returns *something*.
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 800 });
    Object.defineProperty(container, 'offsetHeight', { configurable: true, value: 800 });

    const { result } = renderHook(() =>
      useVirtualizer({
        items,
        virtual: { estimatedSize: 100, overscan: 0 },
        resolvedMode: "virtualized",
        getScrollElement: () => container,
      })
    );

    // Initial render should have some items (default count 0 -> length upgrade).
    // Virtualizer is async in updates mostly? No, synchronous usually for initial measurements if estimate is used.

    expect(result.current.virtualItems.length).toBeGreaterThan(0);
    expect(result.current.totalSize).toBe(10000);
  });
});
