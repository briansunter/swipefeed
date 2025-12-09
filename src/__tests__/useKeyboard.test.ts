// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKeyboard } from "../hooks/useKeyboard";

describe("useKeyboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("supports altPrev/altNext bindings", () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const { result } = renderHook(() =>
      useKeyboard({
        orientation: "vertical",
        direction: "ltr",
        config: { enabled: true, bindings: { altPrev: ["k"], altNext: ["j"] } },
        onPrev,
        onNext,
      }),
    );

    result.current.onKeyDown(new KeyboardEvent("keydown", { key: "k" }) as unknown as React.KeyboardEvent);
    result.current.onKeyDown(new KeyboardEvent("keydown", { key: "j" }) as unknown as React.KeyboardEvent);

    expect(onPrev).toHaveBeenCalled();
    expect(onNext).toHaveBeenCalled();
  });

  it("supports Home and End keys for first/last navigation", () => {
    const onFirst = vi.fn();
    const onLast = vi.fn();
    const { result } = renderHook(() =>
      useKeyboard({
        orientation: "vertical",
        direction: "ltr",
        onPrev: vi.fn(),
        onNext: vi.fn(),
        onFirst,
        onLast,
      }),
    );

    result.current.onKeyDown(new KeyboardEvent("keydown", { key: "Home" }) as unknown as React.KeyboardEvent);
    result.current.onKeyDown(new KeyboardEvent("keydown", { key: "End" }) as unknown as React.KeyboardEvent);

    expect(onFirst).toHaveBeenCalled();
    expect(onLast).toHaveBeenCalled();
  });

  it("uses Arrow Left/Right for horizontal orientation", () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const { result } = renderHook(() =>
      useKeyboard({
        orientation: "horizontal",
        direction: "ltr",
        onPrev,
        onNext,
      }),
    );

    result.current.onKeyDown(new KeyboardEvent("keydown", { key: "ArrowLeft" }) as unknown as React.KeyboardEvent);
    result.current.onKeyDown(new KeyboardEvent("keydown", { key: "ArrowRight" }) as unknown as React.KeyboardEvent);

    expect(onPrev).toHaveBeenCalled();
    expect(onNext).toHaveBeenCalled();
  });

  it("inverts horizontal keys for RTL direction", () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const { result } = renderHook(() =>
      useKeyboard({
        orientation: "horizontal",
        direction: "rtl",
        onPrev,
        onNext,
      }),
    );

    // In RTL, ArrowLeft should go next (forward), ArrowRight should go prev (backward)
    result.current.onKeyDown(new KeyboardEvent("keydown", { key: "ArrowLeft" }) as unknown as React.KeyboardEvent);
    expect(onNext).toHaveBeenCalled();

    result.current.onKeyDown(new KeyboardEvent("keydown", { key: "ArrowRight" }) as unknown as React.KeyboardEvent);
    expect(onPrev).toHaveBeenCalled();
  });

  it("does nothing when disabled", () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const { result } = renderHook(() =>
      useKeyboard({
        orientation: "vertical",
        direction: "ltr",
        config: { enabled: false },
        onPrev,
        onNext,
      }),
    );

    result.current.onKeyDown(new KeyboardEvent("keydown", { key: "ArrowUp" }) as unknown as React.KeyboardEvent);
    result.current.onKeyDown(new KeyboardEvent("keydown", { key: "ArrowDown" }) as unknown as React.KeyboardEvent);

    expect(onPrev).not.toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
  });

  it("adds global event listener when global is true", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() =>
      useKeyboard({
        orientation: "vertical",
        direction: "ltr",
        config: { enabled: true, global: true },
        onPrev: vi.fn(),
        onNext: vi.fn(),
      }),
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  it("responds to global keyboard events", () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();

    renderHook(() =>
      useKeyboard({
        orientation: "vertical",
        direction: "ltr",
        config: { enabled: true, global: true },
        onPrev,
        onNext,
      }),
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    });

    expect(onPrev).toHaveBeenCalled();
  });

  it("does not add global listener when global is false", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");

    renderHook(() =>
      useKeyboard({
        orientation: "vertical",
        direction: "ltr",
        config: { enabled: true, global: false },
        onPrev: vi.fn(),
        onNext: vi.fn(),
      }),
    );

    expect(addEventListenerSpy).not.toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  it("ignores unbound keys", () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const { result } = renderHook(() =>
      useKeyboard({
        orientation: "vertical",
        direction: "ltr",
        onPrev,
        onNext,
      }),
    );

    result.current.onKeyDown(new KeyboardEvent("keydown", { key: "a" }) as unknown as React.KeyboardEvent);
    result.current.onKeyDown(new KeyboardEvent("keydown", { key: "Escape" }) as unknown as React.KeyboardEvent);

    expect(onPrev).not.toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
  });

  it("uses PageUp/PageDown as alt bindings by default", () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const { result } = renderHook(() =>
      useKeyboard({
        orientation: "vertical",
        direction: "ltr",
        onPrev,
        onNext,
      }),
    );

    result.current.onKeyDown(new KeyboardEvent("keydown", { key: "PageUp" }) as unknown as React.KeyboardEvent);
    result.current.onKeyDown(new KeyboardEvent("keydown", { key: "PageDown" }) as unknown as React.KeyboardEvent);

    expect(onPrev).toHaveBeenCalled();
    expect(onNext).toHaveBeenCalled();
  });
});

