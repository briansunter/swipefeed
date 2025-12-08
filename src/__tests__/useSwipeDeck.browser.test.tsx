// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SwipeDeck } from "../components/SwipeDeck";

describe("SwipeDeck (browser-like)", () => {
  it("calls onIndexChange on wheel in virtualized mode", async () => {
    vi.useFakeTimers();
    // force reduced motion so scroll uses instant behavior in tests
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
    const items = [{ id: "a" }, { id: "b" }];
    render(
      <SwipeDeck
        items={items}
        mode="virtualized"
        visibility={{ debounce: 0 }}
        virtual={{ estimatedSize: 400 }}
        wheel={{ discretePaging: true, threshold: 1, debounce: 0 }}
        onIndexChange={(i) => onIndexChange(i)}
      >
        {({ item, props, isActive }) => (
          <div {...props} data-testid={`item-${item.id}`} data-active={isActive} />
        )}
      </SwipeDeck>,
    );

    const viewport = screen.getByRole("feed");
    await act(async () => {
      fireEvent.wheel(viewport, { deltaY: 5 });
      await vi.runAllTimersAsync();
    });

    expect(onIndexChange).toHaveBeenCalledWith(1);
    vi.useRealTimers();
  });

  it("supports horizontal RTL wheel navigation", async () => {
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
        items={[
          { id: "x" },
          { id: "y" },
        ]}
        orientation="horizontal"
        direction="rtl"
        mode="native"
        visibility={{ debounce: 0 }}
        wheel={{ threshold: 1, debounce: 0 }}
        onIndexChange={(i) => onIndexChange(i)}
      >
        {({ item, props, isActive }) => (
          <div {...props} data-testid={`item-${item.id}`} data-active={isActive} />
        )}
      </SwipeDeck>,
    );

    const viewport = screen.getByRole("feed");
    await act(async () => {
      fireEvent.wheel(viewport, { deltaX: -5 }); // RTL flips direction
      await vi.runAllTimersAsync();
    });

    expect(onIndexChange).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

