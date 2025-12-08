// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSwipeDeck } from "../hooks/useSwipeDeck";

describe("useSwipeDeck loop + controlled reconciliation", () => {
  it("wraps around when loop=true in virtualized mode", () => {
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

    const { result } = renderHook(() =>
      useSwipeDeck({
        items: [1, 2, 3],

        loop: true,
      }),
    );

    result.current.scrollTo(2, { behavior: "instant" });
    result.current.next();
    expect(result.current.index).toBe(0);
  });

  it("controlled index requests reconciliation", () => {
    const onIndexChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ idx }) =>
        useSwipeDeck({
          items: [1, 2, 3],

          index: idx,
          onIndexChange,
        }),
      { initialProps: { idx: 0 } },
    );

    result.current.next();
    expect(onIndexChange).toHaveBeenCalledWith(1, "user:keyboard");

    rerender({ idx: 2 });
    expect(result.current.index).toBe(2);
  });
});

