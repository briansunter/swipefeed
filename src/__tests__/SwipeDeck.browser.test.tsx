// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { createRef } from "react";
import { SwipeDeck } from "../components/SwipeDeck";
import type { SwipeDeckHandle } from "../types";

describe("SwipeDeck Browser Tests", () => {
    // Mock ResizeObserver
    globalThis.ResizeObserver = class ResizeObserver {
        observe() { }
        unobserve() { }
        disconnect() { }
    };

    it("exposes imperative handle methods", async () => {
        const ref = createRef<SwipeDeckHandle>();
        const onIndexChange = vi.fn();
        const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

        render(
            <SwipeDeck
                ref={ref}
                items={items}
                onIndexChange={onIndexChange}
            >
                {({ item, props }) => (
                    <div {...props} data-testid={`item-${item.id}`}>
                        {item.id}
                    </div>
                )}
            </SwipeDeck>
        );

        // Verify initial state via handle
        expect(ref.current).toBeDefined();
        expect(ref.current?.getState().index).toBe(0);
        expect(ref.current?.getState().canPrev).toBe(false);
        expect(ref.current?.getState().canNext).toBe(true);

        // Test next()
        await act(async () => {
            ref.current?.next();
        });
        expect(ref.current?.getState().index).toBe(1);

        // Test prev()
        await act(async () => {
            ref.current?.prev();
        });
        expect(ref.current?.getState().index).toBe(0);

        // Test scrollTo()
        await act(async () => {
            ref.current?.scrollTo(2);
        });
        expect(ref.current?.getState().index).toBe(2);
    });

    it("renders with polymorphic 'as' prop", () => {
        const items = [{ id: "1" }];
        render(
            <SwipeDeck
                items={items}
                as="section"
            >
                {({ item, props }) => <div {...props}>{item.id}</div>}
            </SwipeDeck>
        );

        // SwipeDeck uses role="feed" by default
        const root = screen.getByRole("feed");
        expect(root.tagName).toBe("SECTION");
    });
});
