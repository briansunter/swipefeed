// @vitest-environment happy-dom
/**
 * Browser-specific tests that require real DOM behavior.
 * Only tests that MUST run in a browser environment belong here.
 * All other tests should be in unit test files.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { SwipeDeck } from "../components/SwipeDeck";
import type { SwipeDeckHandle } from "../types";
import React, { createRef } from "react";

describe("SwipeDeck Browser-Only Tests", () => {
  // Mock ResizeObserver
  globalThis.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
  };

  afterEach(() => {
    cleanup();
  });

  it("handles wheel events with real DOM scroll behavior", async () => {
    vi.useFakeTimers();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      media: "",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList);

    const onIndexChange = vi.fn();
    render(
      <SwipeDeck
        items={[{ id: "a" }, { id: "b" }]}
        wheel={{ discretePaging: true, threshold: 1, debounce: 0 }}
        onIndexChange={onIndexChange}
      >
        {({ item, props }) => <div {...props}>{item.id}</div>}
      </SwipeDeck>,
    );

    const viewport = screen.getByRole("feed");
    await act(async () => {
      fireEvent.wheel(viewport, { deltaY: 5 });
      await vi.runAllTimersAsync();
    });

    expect(onIndexChange).toHaveBeenCalledWith(1, expect.any(String));
    vi.useRealTimers();
  });

  it("handles horizontal wheel in RTL mode", async () => {
    vi.useFakeTimers();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true, media: "", onchange: null,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList);

    const onIndexChange = vi.fn();
    render(
      <SwipeDeck
        items={[{ id: "x" }, { id: "y" }]}
        orientation="horizontal"
        direction="rtl"
        wheel={{ threshold: 1, debounce: 0 }}
        onIndexChange={onIndexChange}
      >
        {({ item, props }) => <div {...props}>{item.id}</div>}
      </SwipeDeck>,
    );

    const viewport = screen.getByRole("feed");
    await act(async () => {
      fireEvent.wheel(viewport, { deltaX: -5 });
      await vi.runAllTimersAsync();
    });

    expect(onIndexChange).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("handleScroll updates index when scrolling with visible items", async () => {
    vi.useFakeTimers();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true, media: "", onchange: null,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList);

    const onIndexChange = vi.fn();
    const ref = createRef<SwipeDeckHandle>();

    render(
      <SwipeDeck
        ref={ref}
        items={[{ id: "a" }, { id: "b" }, { id: "c" }]}
        virtual={{ estimatedSize: 300 }}
        onIndexChange={onIndexChange}
        style={{ height: 300, overflow: "auto" }}
      >
        {({ item, props }) => (
          <div {...props} style={{ ...props.style, height: 300 }}>
            {item.id}
          </div>
        )}
      </SwipeDeck>,
    );

    const viewport = screen.getByRole("feed");

    // Directly set scroll position to simulate scrolling to second item
    await act(async () => {
      Object.defineProperty(viewport, "scrollTop", { value: 300, writable: true });
      Object.defineProperty(viewport, "clientHeight", { value: 300, writable: true });
      fireEvent.scroll(viewport);
      await vi.runAllTimersAsync();
    });

    vi.useRealTimers();
  });

  it("handleScroll finds center item in visible virtualItems", async () => {
    vi.useFakeTimers();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true, media: "", onchange: null,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList);

    const onIndexChange = vi.fn();

    render(
      <SwipeDeck
        items={[{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }]}
        virtual={{ estimatedSize: 200 }}
        onIndexChange={onIndexChange}
        style={{ height: 200, overflow: "auto" }}
      >
        {({ item, props }) => (
          <div {...props} style={{ height: 200 }}>
            Item {item.id}
          </div>
        )}
      </SwipeDeck>,
    );

    const viewport = screen.getByRole("feed");

    // Scroll to trigger handleScroll - the browser will have real virtualItems
    await act(async () => {
      Object.defineProperty(viewport, "scrollTop", { value: 400, writable: true });
      Object.defineProperty(viewport, "clientHeight", { value: 200, writable: true });
      fireEvent.scroll(viewport);
      await vi.runAllTimersAsync();
    });

    vi.useRealTimers();
  });

  it("handleScroll with horizontal orientation uses scrollLeft", async () => {
    vi.useFakeTimers();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true, media: "", onchange: null,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList);

    const onIndexChange = vi.fn();

    render(
      <SwipeDeck
        items={[{ id: "a" }, { id: "b" }, { id: "c" }]}
        orientation="horizontal"
        virtual={{ estimatedSize: 300 }}
        onIndexChange={onIndexChange}
        style={{ width: 300, overflow: "auto" }}
      >
        {({ item, props }) => (
          <div {...props} style={{ width: 300 }}>
            {item.id}
          </div>
        )}
      </SwipeDeck>,
    );

    const viewport = screen.getByRole("feed");

    await act(async () => {
      Object.defineProperty(viewport, "scrollLeft", { value: 300, writable: true });
      Object.defineProperty(viewport, "clientWidth", { value: 300, writable: true });
      fireEvent.scroll(viewport);
      await vi.runAllTimersAsync();
    });

    vi.useRealTimers();
  });

  it("horizontal drag uses scrollLeft in onDrag", async () => {
    vi.useFakeTimers();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true, media: "", onchange: null,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList);

    const onIndexChange = vi.fn();

    render(
      <SwipeDeck
        items={[{ id: "a" }, { id: "b" }, { id: "c" }]}
        orientation="horizontal"
        onIndexChange={onIndexChange}
        style={{ width: 300, overflow: "auto" }}
      >
        {({ item, props }) => (
          <div {...props} style={{ width: 300 }}>
            {item.id}
          </div>
        )}
      </SwipeDeck>,
    );

    const viewport = screen.getByRole("feed");

    // Simulate horizontal drag gesture using pointer events
    await act(async () => {
      fireEvent.pointerDown(viewport, { clientX: 200, pointerId: 1, button: 0 });
      fireEvent.pointerMove(viewport, { clientX: 50, pointerId: 1 }); // drag left
      fireEvent.pointerUp(viewport, { clientX: 50, pointerId: 1 });
      await vi.runAllTimersAsync();
    });

    vi.useRealTimers();
  });
});
