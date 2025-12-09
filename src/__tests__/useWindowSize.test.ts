// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWindowSize } from "../hooks/useWindowSize";

describe("useWindowSize", () => {
    let originalInnerWidth: number;
    let originalInnerHeight: number;

    beforeEach(() => {
        originalInnerWidth = window.innerWidth;
        originalInnerHeight = window.innerHeight;
        Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 1024 });
        Object.defineProperty(window, "innerHeight", { configurable: true, writable: true, value: 768 });
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: originalInnerWidth });
        Object.defineProperty(window, "innerHeight", { configurable: true, writable: true, value: originalInnerHeight });
    });

    it("returns initial window size", () => {
        const { result } = renderHook(() => useWindowSize());

        expect(result.current.width).toBe(1024);
        expect(result.current.height).toBe(768);
    });

    it("updates size on window resize with debounce", () => {
        const { result } = renderHook(() => useWindowSize());

        // Change window size
        Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 800 });
        Object.defineProperty(window, "innerHeight", { configurable: true, writable: true, value: 600 });

        // Trigger resize event
        act(() => {
            window.dispatchEvent(new Event("resize"));
        });

        // Size should not update immediately (debounced)
        expect(result.current.width).toBe(1024);
        expect(result.current.height).toBe(768);

        // Advance timer past debounce delay
        act(() => {
            vi.advanceTimersByTime(100);
        });

        expect(result.current.width).toBe(800);
        expect(result.current.height).toBe(600);
    });

    it("cancels pending update on multiple rapid resizes", () => {
        const { result } = renderHook(() => useWindowSize());

        // First resize
        Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 500 });
        act(() => {
            window.dispatchEvent(new Event("resize"));
        });

        act(() => {
            vi.advanceTimersByTime(50);
        });

        // Second resize before debounce completes
        Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 600 });
        act(() => {
            window.dispatchEvent(new Event("resize"));
        });

        act(() => {
            vi.advanceTimersByTime(100);
        });

        // Should have the final value, not the intermediate
        expect(result.current.width).toBe(600);
    });

    it("cleans up event listener on unmount", () => {
        const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

        const { unmount } = renderHook(() => useWindowSize());

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));

        removeEventListenerSpy.mockRestore();
    });

    it("clears timeout on unmount", () => {
        const { unmount } = renderHook(() => useWindowSize());

        // Trigger resize to create a pending timeout
        act(() => {
            window.dispatchEvent(new Event("resize"));
        });

        // Unmount before timeout fires
        unmount();

        // Should not throw when timers complete
        act(() => {
            vi.advanceTimersByTime(200);
        });
    });
});
