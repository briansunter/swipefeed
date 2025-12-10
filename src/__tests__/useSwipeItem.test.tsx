import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSwipeItem, SwipeItemContext } from "../hooks/useSwipeItem";
import type React from 'react';

/**
 * @vitest-environment jsdom
 */

describe("useSwipeItem", () => {
    it("throws error when used outside of SwipeDeck/SwipeItemContext", () => {
        // Suppress console.error for the expected error
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        expect(() => {
            renderHook(() => useSwipeItem());
        }).toThrow("useSwipeItem must be used within a SwipeDeck item");

        consoleSpy.mockRestore();
    });

    it("returns context context when used within SwipeItemContext", () => {
        const mockContextValue = {
            // @ts-ignore - simplified mock for testing
            item: { id: 1, text: 'hello' },
            index: 0,
            isActive: true,
            shouldPreload: false,
            // biome-ignore lint/suspicious/noExplicitAny: Mock props
            props: {} as any
        };

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <SwipeItemContext.Provider value={mockContextValue}>
                {children}
            </SwipeItemContext.Provider>
        );

        const { result } = renderHook(() => useSwipeItem(), { wrapper });

        expect(result.current).toBe(mockContextValue);
    });
});
