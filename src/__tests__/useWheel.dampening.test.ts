// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWheel } from "../hooks/useWheel";
import { useRef } from "react";

describe("useWheel advanced logic", () => {
    let now = 1000;

    beforeEach(() => {
        vi.useFakeTimers();
        // Mock performance.now
        vi.spyOn(performance, 'now').mockImplementation(() => now);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        now = 1000;
    });

    const setupHook = (props: Partial<Parameters<typeof useWheel>[0]> = {}) => {
        const onRequestIndexChange = vi.fn();
        const element = document.createElement("div");
        const { result } = renderHook(() => {
            const viewportRef = useRef<HTMLElement | null>(element);
            useWheel({
                orientation: "vertical",
                direction: "ltr",
                discretePaging: true,
                threshold: 100,
                debounce: 100,
                cooldown: 800,
                onRequestIndexChange,
                viewport: viewportRef.current,
                ...props
            });
            return { viewportRef };
        });
        return { onRequestIndexChange, element };
    };

    it("respects cooldown period after navigation", () => {
        const { onRequestIndexChange, element } = setupHook({ cooldown: 500 });

        // Trigger navigation
        const event1 = new WheelEvent("wheel", { deltaY: 60 });
        element.dispatchEvent(event1);
        element.dispatchEvent(event1); // Accumulate 120 > 100
        expect(onRequestIndexChange).toHaveBeenCalledTimes(1);

        // Advance time but still inside cooldown
        now += 200; // < 500
        const event2 = new WheelEvent("wheel", { deltaY: 120 });
        element.dispatchEvent(event2);

        // Should NOT trigger again (ignored)
        expect(onRequestIndexChange).toHaveBeenCalledTimes(1);

        // Advance past cooldown
        now += 400; // Total > 500
        const event3 = new WheelEvent("wheel", { deltaY: 60 });
        element.dispatchEvent(event3);
        element.dispatchEvent(event3);

        // Should trigger again
        expect(onRequestIndexChange).toHaveBeenCalledTimes(2);
    });

    it("responds to rapid trackpad events (accumulation)", () => {
        const { onRequestIndexChange, element } = setupHook({ threshold: 50 });

        // Trigger a series of rapid small events (trackpad momentum)
        // 5 * 10 = 50. Should trigger now as we want 1:1 tracking for small events.

        // 1st event
        element.dispatchEvent(new WheelEvent("wheel", { deltaY: 10 }));
        expect(onRequestIndexChange).not.toHaveBeenCalled();

        // 2nd - 4th event (rapid)
        // Note: we removed explicit momentum dampening for small deltas
        now += 10; element.dispatchEvent(new WheelEvent("wheel", { deltaY: 10 }));
        now += 10; element.dispatchEvent(new WheelEvent("wheel", { deltaY: 10 }));
        now += 10; element.dispatchEvent(new WheelEvent("wheel", { deltaY: 10 }));

        // 5th event
        now += 10;
        element.dispatchEvent(new WheelEvent("wheel", { deltaY: 10 }));

        // Total 50. Should trigger.
        expect(onRequestIndexChange).toHaveBeenCalledTimes(1);
    });

    it("locks direction during gesture", () => {
        const { onRequestIndexChange, element } = setupHook({ threshold: 50 });

        // Scroll down (positive)
        element.dispatchEvent(new WheelEvent("wheel", { deltaY: 20 })); // Accum: 20

        // Scroll up (negative) - should reset and lock to up? 
        // Logic: if gestureDirection !== current -> reset.
        element.dispatchEvent(new WheelEvent("wheel", { deltaY: -20 })); // Reset accum to 0, then start accum -20.

        // If it didn't reset (just summed): 20 - 20 = 0.
        // If it reset: -20.

        element.dispatchEvent(new WheelEvent("wheel", { deltaY: -20 })); // -40
        element.dispatchEvent(new WheelEvent("wheel", { deltaY: -20 })); // -60 -> Trigger

        expect(onRequestIndexChange).toHaveBeenCalledWith(-1);
    });
});
