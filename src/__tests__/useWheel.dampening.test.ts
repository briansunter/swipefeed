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
        now += 200;
        const event2 = new WheelEvent("wheel", { deltaY: 120 });
        element.dispatchEvent(event2);

        // Should NOT trigger again
        expect(onRequestIndexChange).toHaveBeenCalledTimes(1);

        // Advance past cooldown
        now += 400; // Total 600 > 500
        const event3 = new WheelEvent("wheel", { deltaY: 60 });
        element.dispatchEvent(event3);
        element.dispatchEvent(event3);

        // Should trigger again
        expect(onRequestIndexChange).toHaveBeenCalledTimes(2);
    });

    it("dampens rapid trackpad events", () => {
        const { onRequestIndexChange, element } = setupHook({ threshold: 50 });

        // Trigger a series of rapid small events (trackpad momentum)
        // Normal delta 10 would accumulate to 50 in 5 events.
        // But with dampening, it should take more.

        // 1st event
        element.dispatchEvent(new WheelEvent("wheel", { deltaY: 10 }));
        expect(onRequestIndexChange).not.toHaveBeenCalled();

        // 2nd - 4th event (rapid, < 16ms apart)
        now += 10; element.dispatchEvent(new WheelEvent("wheel", { deltaY: 10 }));
        now += 10; element.dispatchEvent(new WheelEvent("wheel", { deltaY: 10 }));
        now += 10; element.dispatchEvent(new WheelEvent("wheel", { deltaY: 10 }));

        // Total so far: 40 without dampening. 
        // Logic: if timeDelta < 16 && eventCount > 3...
        // Events: 1(count=1), 2(count=2), 3(count=3), 4(count=4 -> damped)

        // 5th event (damped)
        now += 10;
        element.dispatchEvent(new WheelEvent("wheel", { deltaY: 10 }));

        // Check internal accumulation via behavior is hard without exposing it,
        // but we can assert that it did NOT trigger yet if dampening works efficiently,
        // or strictly check if we need MORE events than usual.

        // If not damped: 5 * 10 = 50 -> trigger.
        // If damped: 4th and 5th are damped.
        // 10 + 10 + 10 = 30.
        // 4th: damped factor approx 1 - (1 * 0.1) = 0.9 -> 9. Accum: 39.
        // 5th: damped factor approx 1 - (2 * 0.1) = 0.8 -> 8. Accum: 47.
        // So it should NOT have triggered yet.

        expect(onRequestIndexChange).not.toHaveBeenCalled();

        // One more undamped large event would push it over
        now += 100; // Not rapid
        element.dispatchEvent(new WheelEvent("wheel", { deltaY: 20 }));
        expect(onRequestIndexChange).toHaveBeenCalledTimes(1);
    });

    it("locks direction during gesture", () => {
        const { onRequestIndexChange, element } = setupHook({ threshold: 50 });

        // Scroll down (positive)
        element.dispatchEvent(new WheelEvent("wheel", { deltaY: 20 })); // Accum: 20

        // Scroll up (negative) - should reset and lock to up? 
        // Logic: if gestureDirection !== current -> reset.
        element.dispatchEvent(new WheelEvent("wheel", { deltaY: -20 })); // Reset accum to 0, then start accum -20?
        // Wait, logic says: 
        // if (direction changed) { accum = 0; }
        // then accum += delta. So accum becomes -20.

        // Let's verify it doesn't sum them (20 + -20 = 0).
        // If it summed, we have 0.
        // If it reset, we have -20.
        // If we do another -20, we have -40. 
        // Another -20 -> -60 -> Trigger -1 (up).

        // If it didn't reset (just summed): 20 - 20 - 20 - 20 = -40. Not triggered.

        element.dispatchEvent(new WheelEvent("wheel", { deltaY: -20 }));
        element.dispatchEvent(new WheelEvent("wheel", { deltaY: -20 }));
        // Total -20 * 3 = -60 < -50.

        expect(onRequestIndexChange).toHaveBeenCalledWith(-1);
    });
});
