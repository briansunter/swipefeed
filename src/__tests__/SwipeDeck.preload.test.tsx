// @vitest-environment jsdom
import { describe, expect, it, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { SwipeDeck } from "../components/SwipeDeck";

describe("SwipeDeck / preload", () => {
    // Mock clientHeight for virtualization
    beforeAll(() => {
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 800 });
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 800 });
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 400 });
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 400 });
        globalThis.ResizeObserver = class ResizeObserver {
            observe() { }
            unobserve() { }
            disconnect() { }
        };
    });

    const getItems = (count: number) => Array.from({ length: count }, (_, i) => ({ id: i }));

    it("passes shouldPreload=false when preload option is not set", () => {
        render(
            <SwipeDeck items={getItems(3)}>
                {({ item, shouldPreload }) => (
                    <div data-testid={`item-${item.id}`} data-preload={shouldPreload} />
                )}
            </SwipeDeck>
        );
        // Index 0 is active. Index 1 is next.
        expect(screen.getByTestId("item-0").getAttribute("data-preload")).toBe("false");
        expect(screen.getByTestId("item-1").getAttribute("data-preload")).toBe("false");
    });

    it("sets shouldPreload=true for the next item when preload=1", () => {
        render(
            <SwipeDeck items={getItems(3)} preload={1}>
                {({ item, shouldPreload }) => (
                    <div data-testid={`item-${item.id}`} data-preload={shouldPreload} />
                )}
            </SwipeDeck>
        );
        // Index 0 active.
        expect(screen.getByTestId("item-0").getAttribute("data-preload")).toBe("false");
        // Index 1 is next -> shouldPreload = true
        expect(screen.getByTestId("item-1").getAttribute("data-preload")).toBe("true");
        // Index 2 is further away -> shouldPreload = false
        expect(screen.getByTestId("item-2").getAttribute("data-preload")).toBe("false");
    });

    it("sets shouldPreload=true for multiple items when preload=2", () => {
        render(
            <SwipeDeck items={getItems(5)} preload={2}>
                {({ item, shouldPreload }) => (
                    <div data-testid={`item-${item.id}`} data-preload={shouldPreload} />
                )}
            </SwipeDeck>
        );
        expect(screen.getByTestId("item-0").getAttribute("data-preload")).toBe("false");
        expect(screen.getByTestId("item-1").getAttribute("data-preload")).toBe("true");
        expect(screen.getByTestId("item-2").getAttribute("data-preload")).toBe("true");
        expect(screen.getByTestId("item-3").getAttribute("data-preload")).toBe("false");
    });

    it("handle loop wrapping correctly", () => {
        // 3 items. Index 2 (last) is active. Loop is true. Preload=1.
        // Next item should be 0.
        render(
            <SwipeDeck items={getItems(3)} loop preload={1} defaultIndex={2}>
                {({ item, shouldPreload, isActive }) => (
                    <div data-testid={`item-${item.id}`} data-preload={shouldPreload} data-active={isActive} />
                )}
            </SwipeDeck>
        );

        const last = screen.getByTestId("item-2");
        expect(last.getAttribute("data-active")).toBe("true");
        expect(last.getAttribute("data-preload")).toBe("false");

        // Item 0 should be preloading because it wraps around
        const first = screen.getByTestId("item-0");
        expect(first.getAttribute("data-preload")).toBe("true");
    });

    it("does not wrap if loop is false", () => {
        render(
            <SwipeDeck items={getItems(3)} loop={false} preload={1} defaultIndex={2}>
                {({ item, shouldPreload }) => (
                    <div data-testid={`item-${item.id}`} data-preload={shouldPreload} />
                )}
            </SwipeDeck>
        );
        // Item 0 should NOT be preloading
        const first = screen.getByTestId("item-0");
        expect(first.getAttribute("data-preload")).toBe("false");
    });

    // Coverage for the "isLoopAhead" constants branch which I simplified but kept variables for
    // Wait, I replaced the complex logic with `const distance = ...`.
    // The complex logic blocks (lines 74-80 in Step 58 view) are dead code or unused variables?
    // Checking Step 58:
    // lines 74: const isAhead = ...
    // lines 77: const isLoopAhead = ...
    // lines 89: const distance = ...
    // lines 90: shouldPreload = distance > 0 ...
    // I actually calculate ` isAhead` and `isLoopAhead` but DO NOT USE THEM.
    // This causes unused variable warnings or just wasted CPU, but for coverage, the lines ARE executed.
    // However, `isLoopAhead` calculates: `options.loop && ...`.
    // If I want to cover that branch, I should ensure the conditions are met.
    // BUT, since they are unused, I should really remove them to clean up the code.
    // Removing them is better than testing them if they are unused.
});
