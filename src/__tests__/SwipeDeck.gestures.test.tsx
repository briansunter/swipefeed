// @vitest-environment jsdom
import { describe, expect, it, vi, beforeAll } from "vitest";
import { render, fireEvent, screen, act } from "@testing-library/react";
import { SwipeDeck } from "../components/SwipeDeck";

describe("SwipeDeck Gestures Integration", () => {
    beforeAll(() => {
        // Mock measurements
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 800 });
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 800 });
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 400 });
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 400 });

        // Mock ResizeObserver
        global.ResizeObserver = class ResizeObserver {
            observe() { }
            unobserve() { }
            disconnect() { }
        };

        // Mock pointer capture methods which are often missing in jsdom
        HTMLElement.prototype.setPointerCapture = vi.fn();
        HTMLElement.prototype.releasePointerCapture = vi.fn();
        HTMLElement.prototype.scrollTo = vi.fn();
    });

    it("changes index on vertical swipe", async () => {
        const handleIndexChange = vi.fn();

        render(
            <SwipeDeck
                items={[{ id: 1 }, { id: 2 }, { id: 3 }]}
                onIndexChange={handleIndexChange}
                index={0}
            >
                {({ item }) => <div data-testid={`slide-${item.id}`}>Slide {item.id}</div>}
            </SwipeDeck>
        );

        const slidesContainer = screen.getByRole("feed");
        // Check if onPointerDown is in the props (React internal props are hard to check directly in jsdom, but we can check if the handler fires)

        // Simulate swipe up (drag down to move previous? No, drag up to move next)
        // Drag UP (negative delta) moves to NEXT item.

        // Pointer Down
        act(() => {
            fireEvent.pointerDown(slidesContainer, {
                buttons: 1,
                clientY: 500,
                pointerId: 1
            });
        });

        // Pointer Move (Swipe Up)
        act(() => {
            fireEvent.pointerMove(slidesContainer, {
                buttons: 1,
                clientY: 400, // Moved up 100px
                pointerId: 1
            });
        });

        // Pointer Up
        act(() => {
            fireEvent.pointerUp(slidesContainer, {
                pointerId: 1
            });
        });

        // Expect navigation to index 1
        expect(handleIndexChange).toHaveBeenCalledWith(1, expect.stringContaining("user:gesture"));
    });
});
