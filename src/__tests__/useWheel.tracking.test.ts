// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWheel } from "../hooks/useWheel";

describe("useWheel tracking", () => {
    let now = 0;

    beforeEach(() => {
        vi.useFakeTimers();
        // Mock performance.now
        vi.spyOn(performance, 'now').mockImplementation(() => now);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("calls onDrag callbacks during wheel gesture", () => {
        const onRequestIndexChange = vi.fn();
        const onDragStart = vi.fn();
        const onDrag = vi.fn();
        const onDragEnd = vi.fn();
        const element = document.createElement("div");

        renderHook(() => useWheel({
            orientation: "vertical",
            direction: "ltr",
            discretePaging: true,
            threshold: 100,
            debounce: 100,
            onRequestIndexChange,
            viewport: element,
            onDragStart,
            onDrag,
            onDragEnd
        }));

        // 1. Start gesture
        const event1 = new WheelEvent("wheel", { deltaY: 20 });
        Object.defineProperty(event1, 'preventDefault', { value: vi.fn(), writable: true });
        element.dispatchEvent(event1);

        expect(onDragStart).toHaveBeenCalledTimes(1);
        expect(onDrag).toHaveBeenCalledTimes(1);
        // Vertical wheel down (pos) -> onDrag receives -delta (move content up)
        expect(onDrag).toHaveBeenLastCalledWith(-20);
        expect(event1.preventDefault).toHaveBeenCalled();

        // 2. Continue gesture
        now += 10;
        const event2 = new WheelEvent("wheel", { deltaY: 30 });
        Object.defineProperty(event2, 'preventDefault', { value: vi.fn(), writable: true });
        element.dispatchEvent(event2);

        expect(onDragStart).toHaveBeenCalledTimes(1); // Should not call again
        expect(onDrag).toHaveBeenCalledTimes(2);
        expect(onDrag).toHaveBeenLastCalledWith(-30);

        // 3. End gesture (timeout)
        now += 150; // > debounce
        vi.advanceTimersByTime(150);

        expect(onDragEnd).toHaveBeenCalledTimes(1);

        // Threshold (100) not reached (20+30=50), so NO index change request, but onDragEnd called for snap back
        expect(onRequestIndexChange).not.toHaveBeenCalled();
    });

    it("triggers index change when threshold reached during tracking", () => {
        const onRequestIndexChange = vi.fn();
        const onDragEnd = vi.fn();
        const element = document.createElement("div");

        renderHook(() => useWheel({
            orientation: "vertical",
            direction: "ltr",
            discretePaging: true,
            threshold: 100,
            debounce: 100,
            onRequestIndexChange,
            viewport: element,
            onDragEnd
        }));

        // Scroll 120px (over threshold)
        const event = new WheelEvent("wheel", { deltaY: 120 });
        Object.defineProperty(event, 'preventDefault', { value: vi.fn(), writable: true });
        // NOTE: Our dampening logic caps per-event delta for VISUAL at 40, but accumulation at 120

        element.dispatchEvent(new WheelEvent("wheel", { deltaY: 120 }));

        expect(onRequestIndexChange).toHaveBeenCalledWith(1);
        expect(onDragEnd).toHaveBeenCalled(); // endGesture calls onDragEnd
    });
});
