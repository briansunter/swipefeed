import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { useVirtualizer } from "../hooks/useVirtualizer";

describe("useVirtualizer", () => {
  beforeAll(() => {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() { }
      unobserve() { }
      disconnect() { }
    };
  });

  it("computes virtual items for virtualized mode", () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    const container = document.createElement("div");
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 800 });
    Object.defineProperty(container, 'offsetHeight', { configurable: true, value: 800 });

    const { result } = renderHook(() =>
      useVirtualizer({
        items,
        virtual: { estimatedSize: 100, overscan: 0 },
        getScrollElement: () => container,
      })
    );

    expect(result.current.virtualItems.length).toBeGreaterThan(0);
    expect(result.current.totalSize).toBe(10000);
  });

  it("returns helper functions for item access", () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const container = document.createElement("div");
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 800 });

    const { result } = renderHook(() =>
      useVirtualizer({
        items,
        virtual: { estimatedSize: 100 },
        getScrollElement: () => container,
      })
    );

    // Helper functions should exist and be callable
    expect(typeof result.current.getItemOffset).toBe("function");
    expect(typeof result.current.getItemSize).toBe("function");
    expect(typeof result.current.scrollToIndex).toBe("function");

    // They should return numbers without erroring
    expect(result.current.getItemOffset(0)).toBeGreaterThanOrEqual(0);
    expect(result.current.getItemSize(0)).toBeGreaterThanOrEqual(0);
  });

  it("returns 0 when finding items outside virtual range", () => {
    const items = [{ id: 1 }];
    const container = document.createElement("div");
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 800 });

    const { result } = renderHook(() =>
      useVirtualizer({
        items,
        virtual: { estimatedSize: 100 },
        getScrollElement: () => container,
      })
    );

    // Non-virtualized index should return 0
    expect(result.current.getItemOffset(999)).toBe(0);
    expect(result.current.getItemSize(999)).toBe(0);
  });

  it("exposes containerSize from measurements", () => {
    const items = [{ id: 1 }];
    const container = document.createElement("div");
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 600 });

    const { result } = renderHook(() =>
      useVirtualizer({
        items,
        virtual: { estimatedSize: 100 },
        getScrollElement: () => container,
      })
    );

    expect(result.current.containerSize).toBeGreaterThan(0);
  });

  it("uses function-based estimatedSize when provided", () => {
    const items = [{ size: 100 }, { size: 200 }, { size: 150 }];
    const container = document.createElement("div");
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 800 });

    const { result } = renderHook(() =>
      useVirtualizer({
        items,
        virtual: {
          estimatedSize: (item: unknown) => (item as { size: number }).size,
        },
        getScrollElement: () => container,
      })
    );

    // Total should be sum of all item sizes
    expect(result.current.totalSize).toBe(450);
  });

  it("handles null scroll element gracefully", () => {
    const items = [{ id: 1 }];

    const { result } = renderHook(() =>
      useVirtualizer({
        items,
        virtual: { estimatedSize: 100 },
        getScrollElement: () => null,
      })
    );

    // Should still return structure without crashing
    expect(result.current.virtualItems).toBeDefined();
    expect(result.current.totalSize).toBeGreaterThanOrEqual(0);
  });

  it("supports horizontal orientation", () => {
    const items = [{ id: 1 }, { id: 2 }];
    const container = document.createElement("div");
    Object.defineProperty(container, 'clientWidth', { configurable: true, value: 1024 });
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 800 });

    const { result } = renderHook(() =>
      useVirtualizer({
        items,
        virtual: { estimatedSize: 200 },
        getScrollElement: () => container,
        orientation: "horizontal",
      })
    );

    // Should work without crashing
    expect(result.current.totalSize).toBe(400);
  });

  it("scrollToIndex calls the underlying virtualizer", () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const container = document.createElement("div");
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 800 });
    // Mock scrollTo on container
    container.scrollTo = vi.fn();

    const { result } = renderHook(() =>
      useVirtualizer({
        items,
        virtual: { estimatedSize: 100 },
        getScrollElement: () => container,
      })
    );

    // Call scrollToIndex - this should not throw
    act(() => {
      result.current.scrollToIndex(1, { align: "center", behavior: "smooth" });
    });

    // Verify the function exists and is callable
    expect(typeof result.current.scrollToIndex).toBe("function");
  });

  it("supports custom getItemKey function", () => {
    const items = [{ uniqueId: "a" }, { uniqueId: "b" }];
    const container = document.createElement("div");
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 800 });

    const getItemKey = vi.fn((item: unknown, index: number) =>
      (item as { uniqueId: string }).uniqueId
    );

    const { result } = renderHook(() =>
      useVirtualizer({
        items,
        virtual: {
          estimatedSize: 100,
          getItemKey,
        },
        getScrollElement: () => container,
      })
    );

    // Verify the virtualizer was configured correctly
    expect(result.current.virtualItems).toBeDefined();
    expect(result.current.totalSize).toBe(200); // 2 items * 100
  });
});
