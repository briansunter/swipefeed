// @vitest-environment jsdom
import { describe, expect, it, vi, beforeAll } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSwipeDeck } from "../hooks/useSwipeDeck";

describe("useSwipeDeck callbacks", () => {
    beforeAll(() => {
        // Mocks for virtualizer
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 800 });
        Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: 2400 });
        global.ResizeObserver = class ResizeObserver {
            observe() { }
            unobserve() { }
            disconnect() { }
        };
    });

    it("triggers onEndReached when near end", () => {
        const onEndReached = vi.fn();
        const { result } = renderHook(() => useSwipeDeck({
            items: [1, 2, 3, 4, 5],
            onEndReached,
            endReachedThreshold: 1,
            defaultIndex: 2 // Start in middle to avoid initial trigger
        }));

        // Navigate to end
        act(() => {
            result.current.scrollTo(4, { behavior: "instant" });
        });

        // Verify index updated
        expect(result.current.index).toBe(4);

        expect(onEndReached).toHaveBeenCalledWith({
            distanceFromEnd: 0,
            direction: "forward"
        });
    });

    it("triggers onEndReached when near start (backward)", () => {
        const onEndReached = vi.fn();
        const { result } = renderHook(() => useSwipeDeck({
            items: [1, 2, 3, 4, 5],
            onEndReached,
            endReachedThreshold: 1,
            defaultIndex: 4 // Start at end
        }));

        // Move to first item
        act(() => {
            result.current.scrollTo(0, { behavior: "instant" });
        });

        // Current index 0 <= threshold 1
        expect(onEndReached).toHaveBeenCalledWith(expect.objectContaining({
            direction: "backward"
        }));
    });
});
