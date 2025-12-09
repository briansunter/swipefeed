// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScrollTo } from "../hooks/useScrollTo";

describe("useScrollTo", () => {
    let mockViewport: HTMLElement;
    let scrollToSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        scrollToSpy = vi.fn();
        mockViewport = document.createElement("div");
        mockViewport.scrollTo = scrollToSpy;
    });

    it("calls scrollTo with smooth behavior by default", () => {
        const getViewport = () => mockViewport;
        const setAnimating = vi.fn();

        const { result } = renderHook(() =>
            useScrollTo({ getViewport, setAnimating })
        );

        act(() => {
            result.current.scrollToIndex(500);
        });

        expect(scrollToSpy).toHaveBeenCalledWith({
            top: 500,
            left: 500,
            behavior: "smooth",
        });
        expect(setAnimating).toHaveBeenCalledWith(true);
    });

    it("respects explicit instant behavior", () => {
        const getViewport = () => mockViewport;
        const setAnimating = vi.fn();

        const { result } = renderHook(() =>
            useScrollTo({ getViewport, setAnimating })
        );

        act(() => {
            result.current.scrollToIndex(200, "instant");
        });

        expect(scrollToSpy).toHaveBeenCalledWith({
            top: 200,
            left: 200,
            behavior: "instant",
        });
        expect(setAnimating).toHaveBeenCalledWith(false);
        expect(setAnimating).toHaveBeenCalledWith(false);
    });

    it("respects auto behavior", () => {
        const getViewport = () => mockViewport;
        const setAnimating = vi.fn();

        const { result } = renderHook(() =>
            useScrollTo({ getViewport, setAnimating })
        );

        act(() => {
            result.current.scrollToIndex(100, "auto");
        });

        expect(scrollToSpy).toHaveBeenCalledWith({
            top: 100,
            left: 100,
            behavior: "auto",
        });
    });

    it("does nothing when viewport is null", () => {
        const getViewport = () => null;
        const setAnimating = vi.fn();

        const { result } = renderHook(() =>
            useScrollTo({ getViewport, setAnimating })
        );

        act(() => {
            result.current.scrollToIndex(100);
        });

        expect(setAnimating).not.toHaveBeenCalled();
    });

    it("works without setAnimating callback", () => {
        const getViewport = () => mockViewport;

        const { result } = renderHook(() => useScrollTo({ getViewport }));

        // Should not throw
        act(() => {
            result.current.scrollToIndex(100);
        });

        expect(scrollToSpy).toHaveBeenCalled();
    });

    it("sets animating false immediately for non-smooth behavior", () => {
        const getViewport = () => mockViewport;
        const setAnimating = vi.fn();

        const { result } = renderHook(() =>
            useScrollTo({ getViewport, setAnimating })
        );

        act(() => {
            result.current.scrollToIndex(100, "instant");
        });

        // Should be called twice: true on start, false immediately after
        expect(setAnimating).toHaveBeenNthCalledWith(1, false);
        expect(setAnimating).toHaveBeenNthCalledWith(2, false);
    });
});
