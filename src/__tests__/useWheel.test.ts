// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWheel } from "../hooks/useWheel";

describe("useWheel", () => {
    let mockViewport: HTMLDivElement;

    beforeEach(() => {
        mockViewport = document.createElement("div");
        document.body.appendChild(mockViewport);
        vi.useFakeTimers();
        // Mock performance.now for cooldown testing
        vi.spyOn(performance, "now").mockReturnValue(0);
    });

    afterEach(() => {
        document.body.removeChild(mockViewport);
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    function fireWheelEvent(element: HTMLElement, deltaY: number, deltaX = 0) {
        const event = new WheelEvent("wheel", {
            deltaY,
            deltaX,
            bubbles: true,
            cancelable: true,
        });
        element.dispatchEvent(event);
    }

    it("triggers index change when threshold is met", () => {
        const onRequestIndexChange = vi.fn();

        renderHook(() =>
            useWheel({
                orientation: "vertical",
                direction: "ltr",
                discretePaging: true,
                threshold: 50,
                debounce: 100,
                onRequestIndexChange,
                viewport: mockViewport,
            })
        );

        // Scroll down
        fireWheelEvent(mockViewport, 60);

        expect(onRequestIndexChange).toHaveBeenCalledWith(1);
    });

    it("triggers backward navigation for negative delta", () => {
        const onRequestIndexChange = vi.fn();

        renderHook(() =>
            useWheel({
                orientation: "vertical",
                direction: "ltr",
                discretePaging: true,
                threshold: 50,
                debounce: 100,
                onRequestIndexChange,
                viewport: mockViewport,
            })
        );

        // Scroll up
        fireWheelEvent(mockViewport, -60);

        expect(onRequestIndexChange).toHaveBeenCalledWith(-1);
    });

    it("does not trigger when threshold is not met", () => {
        const onRequestIndexChange = vi.fn();

        renderHook(() =>
            useWheel({
                orientation: "vertical",
                direction: "ltr",
                discretePaging: true,
                threshold: 50,
                debounce: 100,
                onRequestIndexChange,
                viewport: mockViewport,
            })
        );

        // Scroll below threshold
        fireWheelEvent(mockViewport, 30);

        expect(onRequestIndexChange).not.toHaveBeenCalled();
    });

    it("accumulates delta over multiple events", () => {
        const onRequestIndexChange = vi.fn();

        renderHook(() =>
            useWheel({
                orientation: "vertical",
                direction: "ltr",
                discretePaging: true,
                threshold: 50,
                debounce: 100,
                onRequestIndexChange,
                viewport: mockViewport,
            })
        );

        // Multiple small scrolls
        fireWheelEvent(mockViewport, 20);
        expect(onRequestIndexChange).not.toHaveBeenCalled();

        fireWheelEvent(mockViewport, 20);
        expect(onRequestIndexChange).not.toHaveBeenCalled();

        fireWheelEvent(mockViewport, 20);
        expect(onRequestIndexChange).toHaveBeenCalledWith(1);
    });

    it("ignores events during cooldown period", () => {
        const onRequestIndexChange = vi.fn();

        renderHook(() =>
            useWheel({
                orientation: "vertical",
                direction: "ltr",
                discretePaging: true,
                threshold: 50,
                debounce: 100,
                cooldown: 800,
                onRequestIndexChange,
                viewport: mockViewport,
            })
        );

        // First scroll triggers navigation
        fireWheelEvent(mockViewport, 60);
        expect(onRequestIndexChange).toHaveBeenCalledTimes(1);

        // Advance time slightly (still in cooldown)
        vi.spyOn(performance, "now").mockReturnValue(100);

        // Second scroll should be ignored
        fireWheelEvent(mockViewport, 60);
        expect(onRequestIndexChange).toHaveBeenCalledTimes(1);
    });

    it("allows events after cooldown period expires", () => {
        const onRequestIndexChange = vi.fn();

        renderHook(() =>
            useWheel({
                orientation: "vertical",
                direction: "ltr",
                discretePaging: true,
                threshold: 50,
                debounce: 100,
                cooldown: 800,
                onRequestIndexChange,
                viewport: mockViewport,
            })
        );

        // First scroll
        fireWheelEvent(mockViewport, 60);
        expect(onRequestIndexChange).toHaveBeenCalledTimes(1);

        // Advance past cooldown
        vi.spyOn(performance, "now").mockReturnValue(1000);

        // Should work again
        fireWheelEvent(mockViewport, 60);
        expect(onRequestIndexChange).toHaveBeenCalledTimes(2);
    });

    it("uses horizontal deltaX when orientation is horizontal", () => {
        const onRequestIndexChange = vi.fn();

        renderHook(() =>
            useWheel({
                orientation: "horizontal",
                direction: "ltr",
                discretePaging: true,
                threshold: 50,
                debounce: 100,
                onRequestIndexChange,
                viewport: mockViewport,
            })
        );

        // Horizontal scroll
        const event = new WheelEvent("wheel", {
            deltaY: 0,
            deltaX: 60,
            bubbles: true,
            cancelable: true,
        });
        mockViewport.dispatchEvent(event);

        expect(onRequestIndexChange).toHaveBeenCalledWith(1);
    });

    it("inverts direction for RTL in horizontal mode", () => {
        const onRequestIndexChange = vi.fn();

        renderHook(() =>
            useWheel({
                orientation: "horizontal",
                direction: "rtl",
                discretePaging: true,
                threshold: 50,
                debounce: 100,
                onRequestIndexChange,
                viewport: mockViewport,
            })
        );

        // Horizontal scroll right in RTL
        const event = new WheelEvent("wheel", {
            deltaY: 0,
            deltaX: 60,
            bubbles: true,
            cancelable: true,
        });
        mockViewport.dispatchEvent(event);

        // In RTL, positive deltaX should go backward
        expect(onRequestIndexChange).toHaveBeenCalledWith(-1);
    });

    it("does nothing when discretePaging is false", () => {
        const onRequestIndexChange = vi.fn();

        renderHook(() =>
            useWheel({
                orientation: "vertical",
                direction: "ltr",
                discretePaging: false,
                threshold: 50,
                debounce: 100,
                onRequestIndexChange,
                viewport: mockViewport,
            })
        );

        fireWheelEvent(mockViewport, 100);

        expect(onRequestIndexChange).not.toHaveBeenCalled();
    });

    it("resets accumulation on direction change", () => {
        const onRequestIndexChange = vi.fn();
        let mockTime = 0;
        vi.spyOn(performance, "now").mockImplementation(() => mockTime);

        renderHook(() =>
            useWheel({
                orientation: "vertical",
                direction: "ltr",
                discretePaging: true,
                threshold: 100, // Higher threshold to prevent early triggering
                debounce: 100,
                onRequestIndexChange,
                viewport: mockViewport,
            })
        );

        // Scroll down - accumulate but don't trigger
        fireWheelEvent(mockViewport, 40);
        expect(onRequestIndexChange).not.toHaveBeenCalled();

        mockTime += 50; // within debounce

        // Change direction (scroll up) - should reset accumulation
        fireWheelEvent(mockViewport, -40);
        expect(onRequestIndexChange).not.toHaveBeenCalled();

        mockTime += 50;
        // Continue in new direction
        fireWheelEvent(mockViewport, -40);
        expect(onRequestIndexChange).not.toHaveBeenCalled();

        mockTime += 50;
        fireWheelEvent(mockViewport, -40);
        // Now accumulated enough
        expect(onRequestIndexChange).toHaveBeenCalledWith(-1);
    });

    it("cleans up event listener on unmount", () => {
        const removeEventListenerSpy = vi.spyOn(mockViewport, "removeEventListener");

        const { unmount } = renderHook(() =>
            useWheel({
                orientation: "vertical",
                direction: "ltr",
                discretePaging: true,
                threshold: 50,
                debounce: 100,
                onRequestIndexChange: vi.fn(),
                viewport: mockViewport,
            })
        );

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith("wheel", expect.any(Function));
    });

    it("does nothing when viewport is null", () => {
        const onRequestIndexChange = vi.fn();

        renderHook(() =>
            useWheel({
                orientation: "vertical",
                direction: "ltr",
                discretePaging: true,
                threshold: 50,
                debounce: 100,
                onRequestIndexChange,
                viewport: null,
            })
        );

        // Should not throw or call anything
        expect(onRequestIndexChange).not.toHaveBeenCalled();
    });

    it("resets accumulated value after debounce timeout", () => {
        const onRequestIndexChange = vi.fn();

        renderHook(() =>
            useWheel({
                orientation: "vertical",
                direction: "ltr",
                discretePaging: true,
                threshold: 50,
                debounce: 100,
                onRequestIndexChange,
                viewport: mockViewport,
            })
        );

        // Partial scroll
        fireWheelEvent(mockViewport, 30);
        expect(onRequestIndexChange).not.toHaveBeenCalled();

        // Wait for debounce to reset
        vi.advanceTimersByTime(100);

        // Should need full threshold again
        fireWheelEvent(mockViewport, 40);
        expect(onRequestIndexChange).not.toHaveBeenCalled();

        fireWheelEvent(mockViewport, 20);
        expect(onRequestIndexChange).toHaveBeenCalledWith(1);
    });
});
