// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SwipeDeck } from "../components/SwipeDeck";
import type { SwipeDeckHandle, SwipeDeckMotion } from "../types";

const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("SwipeDeck motion and lifecycle", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      value: 400,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 400,
    });
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    Element.prototype.scrollTo = vi.fn();
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
  });

  it("emits motion without rerender state and exposes the latest snapshot", () => {
    const onMotionChange = vi.fn<(motion: SwipeDeckMotion) => void>();
    const ref = createRef<SwipeDeckHandle>();

    render(
      <SwipeDeck ref={ref} items={items} onMotionChange={onMotionChange}>
        {({ item }) => <div>{item.id}</div>}
      </SwipeDeck>,
    );

    const viewport = screen.getByRole("feed");
    Object.defineProperty(viewport, "scrollTop", {
      configurable: true,
      value: 700,
    });

    act(() => fireEvent.scroll(viewport));

    expect(onMotionChange).toHaveBeenLastCalledWith(expect.objectContaining({
      position: 0.7,
      index: 1,
      offset: 300,
      direction: "forward",
      isSettled: false,
    }));
    expect(ref.current?.getMotion()).toEqual(expect.objectContaining({
      position: 0.7,
      index: 1,
      offset: 300,
    }));
  });

  it("fires exact active and inactive transitions, including unmount", () => {
    const onItemActive = vi.fn();
    const onItemInactive = vi.fn();
    const ref = createRef<SwipeDeckHandle>();
    const rendered = render(
      <SwipeDeck
        ref={ref}
        items={items}
        onItemActive={onItemActive}
        onItemInactive={onItemInactive}
      >
        {({ item }) => <div>{item.id}</div>}
      </SwipeDeck>,
    );

    expect(onItemActive).toHaveBeenCalledTimes(1);
    expect(onItemActive).toHaveBeenLastCalledWith(items[0], 0);
    expect(onItemInactive).not.toHaveBeenCalled();

    act(() => ref.current?.scrollTo(1, { behavior: "instant" }));

    expect(onItemInactive).toHaveBeenCalledTimes(1);
    expect(onItemInactive).toHaveBeenLastCalledWith(items[0], 0);
    expect(onItemActive).toHaveBeenCalledTimes(2);
    expect(onItemActive).toHaveBeenLastCalledWith(items[1], 1);

    rendered.rerender(
      <SwipeDeck
        ref={ref}
        items={items}
        onItemActive={onItemActive}
        onItemInactive={onItemInactive}
      >
        {({ item }) => <div>{item.id}</div>}
      </SwipeDeck>,
    );
    expect(onItemActive).toHaveBeenCalledTimes(2);
    expect(onItemInactive).toHaveBeenCalledTimes(1);

    rendered.unmount();
    expect(onItemInactive).toHaveBeenCalledTimes(2);
    expect(onItemInactive).toHaveBeenLastCalledWith(items[1], 1);
  });

  it("reads horizontal motion from scrollLeft", () => {
    const onMotionChange = vi.fn<(motion: SwipeDeckMotion) => void>();
    render(
      <SwipeDeck items={items} orientation="horizontal" onMotionChange={onMotionChange}>
        {({ item }) => <div>{item.id}</div>}
      </SwipeDeck>,
    );

    const viewport = screen.getByRole("feed");
    Object.defineProperty(viewport, "scrollLeft", {
      configurable: true,
      value: 240,
    });
    act(() => fireEvent.scroll(viewport));

    expect(onMotionChange).toHaveBeenLastCalledWith(expect.objectContaining({
      scrollOffset: 240,
      viewportSize: 400,
      position: 0.6,
      index: 1,
      offset: 160,
    }));
  });

  it("recomputes horizontal motion and alignment after a debounced resize", () => {
    vi.useFakeTimers();
    const resizeCallbacks: ResizeObserverCallback[] = [];
    globalThis.ResizeObserver = class ResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        resizeCallbacks.push(callback);
      }

      observe() {}
      unobserve() {}
      disconnect() {}
    };

    render(
      <SwipeDeck items={items} orientation="horizontal" defaultIndex={1}>
        {({ item }) => <div>{item.id}</div>}
      </SwipeDeck>,
    );
    const viewport = screen.getByRole("feed");
    Object.defineProperty(viewport, "scrollLeft", {
      configurable: true,
      writable: true,
      value: 0,
    });

    act(() => {
      for (const callback of resizeCallbacks) {
        callback([], {} as ResizeObserver);
        callback([], {} as ResizeObserver);
      }
      vi.advanceTimersByTime(50);
    });

    expect(viewport.scrollLeft).toBe(400);
    vi.useRealTimers();
  });

  it("restores vertical alignment after a resize", () => {
    vi.useFakeTimers();
    const resizeCallbacks: ResizeObserverCallback[] = [];
    globalThis.ResizeObserver = class ResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        resizeCallbacks.push(callback);
      }

      observe() {}
      unobserve() {}
      disconnect() {}
    };

    render(
      <SwipeDeck items={items} defaultIndex={1}>
        {({ item }) => <div>{item.id}</div>}
      </SwipeDeck>,
    );
    const viewport = screen.getByRole("feed");
    Object.defineProperty(viewport, "scrollTop", {
      configurable: true,
      writable: true,
      value: 0,
    });

    act(() => {
      for (const callback of resizeCallbacks) callback([], {} as ResizeObserver);
      vi.advanceTimersByTime(50);
    });

    expect(viewport.scrollTop).toBe(1000);
    vi.useRealTimers();
  });
});

describe("SwipeDeck intersection visibility", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      value: 400,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 400,
    });
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
  });

  it("activates the item that crosses the configured visibility ratio", () => {
    let observerCallback: IntersectionObserverCallback | undefined;
    const observe = vi.fn();
    const disconnect = vi.fn();

    globalThis.IntersectionObserver = class IntersectionObserver {
      readonly root = null;
      readonly rootMargin = "0px";
      readonly thresholds = [0, 0.6, 1];

      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }

      observe = observe;
      unobserve = vi.fn();
      disconnect = disconnect;
      takeRecords = () => [];
    };

    const onIndexChange = vi.fn();
    const onItemActive = vi.fn();
    render(
      <SwipeDeck
        items={items}
        visibility={{ strategy: "intersection", intersectionRatio: 0.6, debounce: 0 }}
        onIndexChange={onIndexChange}
        onItemActive={onItemActive}
      >
        {({ item }) => <div>{item.id}</div>}
      </SwipeDeck>,
    );

    const articles = screen.getAllByRole("article");
    expect(observe).toHaveBeenCalled();

    const viewport = screen.getByRole("feed");
    Object.defineProperty(viewport, "scrollTop", {
      configurable: true,
      value: 700,
    });
    act(() => fireEvent.scroll(viewport));
    expect(onIndexChange).not.toHaveBeenCalled();

    act(() => {
      observerCallback?.([
        {
          target: articles[0],
          isIntersecting: true,
          intersectionRatio: 0.35,
        } as unknown as IntersectionObserverEntry,
        {
          target: articles[1],
          isIntersecting: true,
          intersectionRatio: 0.65,
        } as unknown as IntersectionObserverEntry,
      ], {} as IntersectionObserver);
    });

    expect(onIndexChange).toHaveBeenLastCalledWith(1, "visibility");
    expect(onItemActive).toHaveBeenLastCalledWith(items[1], 1);
    expect(disconnect).not.toHaveBeenCalled();

    act(() => {
      observerCallback?.([{
        target: document.createElement("div"),
        isIntersecting: true,
        intersectionRatio: 1,
      } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
      observerCallback?.([{
        target: articles[1],
        isIntersecting: true,
        intersectionRatio: 0.7,
      } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
    });
    expect(onIndexChange).toHaveBeenCalledTimes(1);
  });

  it("debounces intersection activation when configured", () => {
    vi.useFakeTimers();
    let observerCallback: IntersectionObserverCallback | undefined;
    globalThis.IntersectionObserver = class IntersectionObserver {
      readonly root = null;
      readonly rootMargin = "0px";
      readonly thresholds = [0, 0.6, 1];

      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }

      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords = () => [];
    };

    const onIndexChange = vi.fn();
    render(
      <SwipeDeck
        items={items}
        visibility={{ strategy: "intersection", intersectionRatio: 0.6, debounce: 75 }}
        onIndexChange={onIndexChange}
      >
        {({ item }) => <div>{item.id}</div>}
      </SwipeDeck>,
    );

    const incoming = screen.getAllByRole("article")[1];
    act(() => {
      observerCallback?.([{
        target: incoming,
        isIntersecting: true,
        intersectionRatio: 0.7,
      } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
      vi.advanceTimersByTime(74);
    });
    expect(onIndexChange).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onIndexChange).toHaveBeenCalledWith(1, "visibility");
    vi.useRealTimers();
  });

  it("clears a replaced and unmounted visibility debounce", () => {
    vi.useFakeTimers();
    let observerCallback: IntersectionObserverCallback | undefined;
    globalThis.IntersectionObserver = class IntersectionObserver {
      readonly root = null;
      readonly rootMargin = "0px";
      readonly thresholds = [0, 0.6, 1];

      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }

      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords = () => [];
    };

    const onIndexChange = vi.fn();
    const rendered = render(
      <SwipeDeck
        items={items}
        visibility={{ strategy: "intersection", debounce: 100 }}
        onIndexChange={onIndexChange}
      >
        {({ item }) => <div>{item.id}</div>}
      </SwipeDeck>,
    );
    const incoming = screen.getAllByRole("article")[1];
    const entry = {
      target: incoming,
      isIntersecting: true,
      intersectionRatio: 0.7,
    } as unknown as IntersectionObserverEntry;

    act(() => {
      observerCallback?.([entry], {} as IntersectionObserver);
      observerCallback?.([entry], {} as IntersectionObserver);
    });
    rendered.unmount();
    act(() => vi.runAllTimers());

    expect(onIndexChange).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
