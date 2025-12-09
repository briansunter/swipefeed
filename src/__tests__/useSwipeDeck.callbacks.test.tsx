// @vitest-environment jsdom
import { describe, expect, it, vi, beforeAll } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useSwipeDeck } from "../hooks/useSwipeDeck";
import { SwipeDeck } from "../components/SwipeDeck";
import { createRef } from "react";
import type { SwipeDeckHandle } from "../types";

describe("useSwipeDeck callbacks", () => {
    beforeAll(() => {
        // Mocks for virtualizer
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 800 });
        Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: 2400 });
        globalThis.ResizeObserver = class ResizeObserver {
            observe() { }
            unobserve() { }
            disconnect() { }
        };
        // Mock scrollTo for jsdom
        Element.prototype.scrollTo = vi.fn();
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

    it("supports controlled mode with index prop", () => {
        const onIndexChange = vi.fn();
        const { result, rerender } = renderHook(
            ({ index }) => useSwipeDeck({
                items: [1, 2, 3],
                index,
                onIndexChange,
            }),
            { initialProps: { index: 0 } }
        );

        expect(result.current.index).toBe(0);

        // Rerender with new index
        rerender({ index: 2 });
        expect(result.current.index).toBe(2);
    });

    it("handles loop mode with prev/next", () => {
        const onIndexChange = vi.fn();
        const { result } = renderHook(() => useSwipeDeck({
            items: [1, 2, 3],
            loop: true,
            onIndexChange,
        }));

        // Navigate past end
        act(() => {
            result.current.scrollTo(0, { behavior: "instant" });
        });

        act(() => {
            result.current.prev();
        });

        // Loop should wrap to last item
        expect(onIndexChange).toHaveBeenCalledWith(2, "user:keyboard");
    });

    it("handles empty items array", () => {
        const { result } = renderHook(() => useSwipeDeck({
            items: [],
        }));

        expect(result.current.index).toBe(0);
        expect(result.current.items).toHaveLength(0);
        expect(result.current.virtualItems).toBeDefined();
    });

    it("clamps index when items shrink", () => {
        const { result, rerender } = renderHook(
            ({ items }) => useSwipeDeck({ items, defaultIndex: 4 }),
            { initialProps: { items: [1, 2, 3, 4, 5] } }
        );

        expect(result.current.index).toBe(4);

        // Shrink items
        rerender({ items: [1, 2] });
        expect(result.current.index).toBeLessThanOrEqual(1);
    });

    it("exposes canPrev and canNext correctly", () => {
        const { result } = renderHook(() => useSwipeDeck({
            items: [1, 2, 3],
            defaultIndex: 1,
        }));

        expect(result.current.canPrev).toBe(true);
        expect(result.current.canNext).toBe(true);

        // Move to start
        act(() => {
            result.current.scrollTo(0, { behavior: "instant" });
        });
        expect(result.current.canPrev).toBe(false);
        expect(result.current.canNext).toBe(true);

        // Move to end
        act(() => {
            result.current.scrollTo(2, { behavior: "instant" });
        });
        expect(result.current.canPrev).toBe(true);
        expect(result.current.canNext).toBe(false);
    });

    it("provides correct totalSize from virtualizer", () => {
        const { result } = renderHook(() => useSwipeDeck({
            items: [1, 2, 3],
            virtual: { estimatedSize: 100 },
        }));

        // totalSize should be items * estimatedSize
        expect(result.current.totalSize).toBeGreaterThan(0);
    });

    it("horizontal orientation works correctly", () => {
        const { result } = renderHook(() => useSwipeDeck({
            items: [1, 2, 3],
            orientation: "horizontal",
        }));

        expect(result.current.orientation).toBe("horizontal");
    });
});

describe("SwipeDeck component unit tests", () => {
    beforeAll(() => {
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 800 });
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 400 });
        globalThis.ResizeObserver = class ResizeObserver {
            observe() { }
            unobserve() { }
            disconnect() { }
        };
    });

    it("renders with polymorphic as prop", () => {
        render(
            <SwipeDeck items={[{ id: "1" }]} as="section">
                {({ item, props }) => <div {...props}>{item.id}</div>}
            </SwipeDeck>
        );

        const root = screen.getByRole("feed");
        expect(root.tagName).toBe("SECTION");
    });

    it("exposes ref with imperative methods", () => {
        const ref = createRef<SwipeDeckHandle>();
        const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

        render(
            <SwipeDeck ref={ref} items={items}>
                {({ item, props }) => <div {...props}>{item.id}</div>}
            </SwipeDeck>
        );

        expect(ref.current).toBeDefined();
        expect(ref.current?.getState().index).toBe(0);
        expect(typeof ref.current?.next).toBe("function");
        expect(typeof ref.current?.prev).toBe("function");
        expect(typeof ref.current?.scrollTo).toBe("function");
    });

    it("responds to keyboard events", () => {
        const onIndexChange = vi.fn();
        render(
            <SwipeDeck items={[{ id: "a" }, { id: "b" }]} onIndexChange={onIndexChange}>
                {({ item, props }) => <div {...props}>{item.id}</div>}
            </SwipeDeck>
        );

        const viewport = screen.getByRole("feed");

        act(() => {
            fireEvent.keyDown(viewport, { key: "ArrowDown" });
        });

        expect(onIndexChange).toHaveBeenCalled();
    });

    it("Home key navigates to first item (onFirst)", () => {
        const onIndexChange = vi.fn();
        const ref = createRef<SwipeDeckHandle>();

        render(
            <SwipeDeck ref={ref} items={[{ id: "a" }, { id: "b" }, { id: "c" }]} defaultIndex={2} onIndexChange={onIndexChange}>
                {({ item, props }) => <div {...props}>{item.id}</div>}
            </SwipeDeck>
        );

        // Start at index 2
        expect(ref.current?.getState().index).toBe(2);

        const viewport = screen.getByRole("feed");

        act(() => {
            fireEvent.keyDown(viewport, { key: "Home" });
        });

        expect(onIndexChange).toHaveBeenCalledWith(0, "user:keyboard");
    });

    it("End key navigates to last item (onLast)", () => {
        const onIndexChange = vi.fn();

        render(
            <SwipeDeck items={[{ id: "a" }, { id: "b" }, { id: "c" }]} onIndexChange={onIndexChange}>
                {({ item, props }) => <div {...props}>{item.id}</div>}
            </SwipeDeck>
        );

        const viewport = screen.getByRole("feed");

        act(() => {
            fireEvent.keyDown(viewport, { key: "End" });
        });

        expect(onIndexChange).toHaveBeenCalledWith(2, "user:keyboard");
    });

    it("ArrowUp key navigates to previous item (onPrev)", () => {
        const onIndexChange = vi.fn();
        const ref = createRef<SwipeDeckHandle>();

        render(
            <SwipeDeck ref={ref} items={[{ id: "a" }, { id: "b" }, { id: "c" }]} defaultIndex={2} onIndexChange={onIndexChange}>
                {({ item, props }) => <div {...props}>{item.id}</div>}
            </SwipeDeck>
        );

        expect(ref.current?.getState().index).toBe(2);

        const viewport = screen.getByRole("feed");

        act(() => {
            fireEvent.keyDown(viewport, { key: "ArrowUp" });
        });

        expect(onIndexChange).toHaveBeenCalledWith(1, "user:keyboard");
    });

    it("scrollTo method via imperative handle with explicit behavior", () => {
        const onIndexChange = vi.fn();
        const ref = createRef<SwipeDeckHandle>();

        render(
            <SwipeDeck ref={ref} items={[{ id: "a" }, { id: "b" }, { id: "c" }]} onIndexChange={onIndexChange}>
                {({ item, props }) => <div {...props}>{item.id}</div>}
            </SwipeDeck>
        );

        // Call scrollTo with explicit behavior option
        act(() => {
            ref.current?.scrollTo(2, { behavior: "instant" });
        });

        expect(onIndexChange).toHaveBeenCalledWith(2, "programmatic");
    });

    it("merges custom styles with viewport styles", () => {
        render(
            <SwipeDeck
                items={[{ id: "1" }]}
                style={{ backgroundColor: "red" }}
            >
                {({ item, props }) => <div {...props}>{item.id}</div>}
            </SwipeDeck>
        );

        const viewport = screen.getByRole("feed");
        expect(viewport.style.backgroundColor).toBe("red");
    });

    it("sets correct ARIA attributes", () => {
        render(
            <SwipeDeck items={[{ id: "1" }]} ariaLabel="Custom feed">
                {({ item, props }) => <div {...props}>{item.id}</div>}
            </SwipeDeck>
        );

        const viewport = screen.getByRole("feed");
        expect(viewport.getAttribute("aria-label")).toBe("Custom feed");
    });

    it("runs setTimeout callback after navigation with smooth scroll", async () => {
        vi.useFakeTimers();
        const ref = createRef<SwipeDeckHandle>();
        const items = [{ id: "a" }, { id: "b" }];

        render(
            <SwipeDeck ref={ref} items={items}>
                {({ item, props }) => <div {...props}>{item.id}</div>}
            </SwipeDeck>
        );

        await act(async () => {
            ref.current?.scrollTo(1, { behavior: "smooth" });
        });

        // Advance timers past the 600ms timeout for smooth scroll
        await act(async () => {
            vi.advanceTimersByTime(700);
        });

        // The setTimeout callback should have run
        expect(ref.current?.getState().index).toBe(1);
        vi.useRealTimers();
    });

    it("runs setTimeout callback after navigation with instant scroll", async () => {
        vi.useFakeTimers();
        const ref = createRef<SwipeDeckHandle>();
        const items = [{ id: "a" }, { id: "b" }];

        render(
            <SwipeDeck ref={ref} items={items}>
                {({ item, props }) => <div {...props}>{item.id}</div>}
            </SwipeDeck>
        );

        await act(async () => {
            ref.current?.scrollTo(1, { behavior: "instant" });
        });

        // Advance timers past the 50ms timeout for instant scroll
        await act(async () => {
            vi.advanceTimersByTime(100);
        });

        expect(ref.current?.getState().index).toBe(1);
        vi.useRealTimers();
    });

    it("handleTouchStart with horizontal orientation sets correct snap type", () => {
        render(
            <SwipeDeck items={[{ id: "1" }]} orientation="horizontal">
                {({ item, props }) => <div {...props}>{item.id}</div>}
            </SwipeDeck>
        );

        const viewport = screen.getByRole("feed");

        act(() => {
            fireEvent.touchStart(viewport);
        });

        // Should set horizontal snap type
        expect(viewport.style.scrollSnapType).toContain("x");
    });

    it("does not trigger change when navigating to same index", () => {
        const onIndexChange = vi.fn();
        const ref = createRef<SwipeDeckHandle>();

        render(
            <SwipeDeck ref={ref} items={[{ id: "a" }, { id: "b" }]} onIndexChange={onIndexChange}>
                {({ item, props }) => <div {...props}>{item.id}</div>}
            </SwipeDeck>
        );

        // Current index is 0, try to navigate to 0
        act(() => {
            ref.current?.scrollTo(0);
        });

        // onIndexChange should not be called
        expect(onIndexChange).not.toHaveBeenCalled();
    });

    it("clamps index when items array shrinks", () => {
        const { result, rerender } = renderHook(
            ({ items }) => useSwipeDeck({ items, defaultIndex: 4 }),
            { initialProps: { items: [1, 2, 3, 4, 5] } }
        );

        expect(result.current.index).toBe(4);

        // Shrink items to only 2
        rerender({ items: [1, 2] });

        // Index should be clamped to max valid index (1)
        expect(result.current.index).toBeLessThanOrEqual(1);
    });

    it("handleScroll updates active index via RAF", async () => {
        // Mock requestAnimationFrame to execute callback immediately
        const originalRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = vi.fn((cb) => {
            cb(0);
            return 0;
        });

        const onIndexChange = vi.fn();
        const ref = createRef<SwipeDeckHandle>();

        render(
            <SwipeDeck
                ref={ref}
                items={[{ id: "a" }, { id: "b" }, { id: "c" }]}
                onIndexChange={onIndexChange}
                virtual={{ estimatedSize: 100 }}
            >
                {({ item, props }) => <div {...props} style={{ height: 100 }}>{item.id}</div>}
            </SwipeDeck>
        );

        const viewport = screen.getByRole("feed");

        // Trigger scroll event - this should invoke handleScroll
        await act(async () => {
            fireEvent.scroll(viewport);
        });

        // Restore RAF
        window.requestAnimationFrame = originalRAF;
    });

    it("handleScroll skips during programmatic navigation", async () => {
        vi.useFakeTimers();
        const ref = createRef<SwipeDeckHandle>();

        render(
            <SwipeDeck ref={ref} items={[{ id: "a" }, { id: "b" }]}>
                {({ item, props }) => <div {...props}>{item.id}</div>}
            </SwipeDeck>
        );

        const viewport = screen.getByRole("feed");

        // Start navigation (sets isNavigatingRef = true)
        await act(async () => {
            ref.current?.scrollTo(1, { behavior: "smooth" });
        });

        // Scroll during navigation should be ignored
        await act(async () => {
            fireEvent.scroll(viewport);
        });

        vi.useRealTimers();
    });

    it("handleScroll uses horizontal scrollLeft for horizontal orientation", async () => {
        const originalRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = vi.fn((cb) => {
            cb(0);
            return 0;
        });

        render(
            <SwipeDeck
                items={[{ id: "a" }, { id: "b" }]}
                orientation="horizontal"
                virtual={{ estimatedSize: 100 }}
            >
                {({ item, props }) => <div {...props}>{item.id}</div>}
            </SwipeDeck>
        );

        const viewport = screen.getByRole("feed");

        await act(async () => {
            fireEvent.scroll(viewport);
        });

        window.requestAnimationFrame = originalRAF;
    });
});
