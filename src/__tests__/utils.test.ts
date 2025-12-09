// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { clamp } from "../utils/clamp";
import { debounce } from "../utils/debounce";
import { prefersReducedMotion } from "../utils/prefersReducedMotion";
import { raf, cancelRaf, rafBatch } from "../utils/raf";

describe("clamp", () => {
    it("returns value when within range", () => {
        expect(clamp(5, 0, 10)).toBe(5);
    });

    it("returns min when value is below range", () => {
        expect(clamp(-5, 0, 10)).toBe(0);
    });

    it("returns max when value is above range", () => {
        expect(clamp(15, 0, 10)).toBe(10);
    });

    it("returns min when value is NaN", () => {
        expect(clamp(Number.NaN, 0, 10)).toBe(0);
    });

    it("handles equal min and max", () => {
        expect(clamp(5, 5, 5)).toBe(5);
        expect(clamp(10, 5, 5)).toBe(5);
    });

    it("handles negative ranges", () => {
        expect(clamp(-5, -10, -1)).toBe(-5);
        expect(clamp(0, -10, -1)).toBe(-1);
        expect(clamp(-15, -10, -1)).toBe(-10);
    });
});

describe("debounce", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("delays function execution", () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced();
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(50);
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(50);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("resets timer on subsequent calls", () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced();
        vi.advanceTimersByTime(50);
        debounced(); // reset timer
        vi.advanceTimersByTime(50);
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(50);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("passes arguments to the function", () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced("a", "b", 123);
        vi.advanceTimersByTime(100);

        expect(fn).toHaveBeenCalledWith("a", "b", 123);
    });

    it("cancel prevents execution", () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced();
        debounced.cancel();
        vi.advanceTimersByTime(200);

        expect(fn).not.toHaveBeenCalled();
    });

    it("cancel is safe to call multiple times", () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced.cancel();
        debounced.cancel();
        // Should not throw
        expect(fn).not.toHaveBeenCalled();
    });
});

describe("prefersReducedMotion", () => {
    // Note: prefersReducedMotion caches the result, so we can only test once per module load
    // In tests, we can re-import by testing what's already cached
    it("returns a boolean", () => {
        const result = prefersReducedMotion();
        expect(typeof result).toBe("boolean");
    });

    it("returns cached result on subsequent calls", () => {
        const result1 = prefersReducedMotion();
        const result2 = prefersReducedMotion();
        expect(result1).toBe(result2);
    });
});

describe("raf", () => {
    it("calls requestAnimationFrame when available", () => {
        const cb = vi.fn();
        const originalRaf = globalThis.requestAnimationFrame;
        globalThis.requestAnimationFrame = vi.fn((callback) => {
            callback(0);
            return 1;
        });

        const id = raf(cb);

        expect(globalThis.requestAnimationFrame).toHaveBeenCalledWith(cb);
        expect(id).toBe(1);

        globalThis.requestAnimationFrame = originalRaf;
    });

    it("returns undefined when requestAnimationFrame is not available", () => {
        const originalRaf = globalThis.requestAnimationFrame;
        globalThis.requestAnimationFrame = undefined as unknown as typeof globalThis.requestAnimationFrame;

        const id = raf(() => { });

        expect(id).toBeUndefined();

        globalThis.requestAnimationFrame = originalRaf;
    });
});

describe("cancelRaf", () => {
    it("calls cancelAnimationFrame when id is defined", () => {
        const originalCancelRaf = globalThis.cancelAnimationFrame;
        globalThis.cancelAnimationFrame = vi.fn();

        cancelRaf(42);

        expect(globalThis.cancelAnimationFrame).toHaveBeenCalledWith(42);

        globalThis.cancelAnimationFrame = originalCancelRaf;
    });

    it("does nothing when id is undefined", () => {
        const originalCancelRaf = globalThis.cancelAnimationFrame;
        globalThis.cancelAnimationFrame = vi.fn();

        cancelRaf(undefined);

        expect(globalThis.cancelAnimationFrame).not.toHaveBeenCalled();

        globalThis.cancelAnimationFrame = originalCancelRaf;
    });
});

describe("rafBatch", () => {
    it("schedules callback and returns cancel function", () => {
        const cb = vi.fn();
        const originalRaf = globalThis.requestAnimationFrame;
        const originalCancelRaf = globalThis.cancelAnimationFrame;

        let rafCallback: ((time: number) => void) | null = null;
        globalThis.requestAnimationFrame = vi.fn((callback: (time: number) => void) => {
            rafCallback = callback;
            return 1;
        });
        globalThis.cancelAnimationFrame = vi.fn();

        const cancel = rafBatch(cb);

        expect(globalThis.requestAnimationFrame).toHaveBeenCalled();
        expect(typeof cancel).toBe("function");

        // Simulate animation frame
        if (rafCallback) {
            (rafCallback as (time: number) => void)(0);
        }
        expect(cb).toHaveBeenCalled();

        globalThis.requestAnimationFrame = originalRaf;
        globalThis.cancelAnimationFrame = originalCancelRaf;
    });

    it("cancel function calls cancelRaf", () => {
        const originalRaf = globalThis.requestAnimationFrame;
        const originalCancelRaf = globalThis.cancelAnimationFrame;

        globalThis.requestAnimationFrame = vi.fn(() => 42);
        globalThis.cancelAnimationFrame = vi.fn();

        const cancel = rafBatch(() => { });
        cancel();

        expect(globalThis.cancelAnimationFrame).toHaveBeenCalledWith(42);

        globalThis.requestAnimationFrame = originalRaf;
        globalThis.cancelAnimationFrame = originalCancelRaf;
    });
});
