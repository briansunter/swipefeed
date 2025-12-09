// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWheel } from "../hooks/useWheel";
describe("useWheel continuous mode", () => {
    it("does not page when discretePaging=false", () => {
        const onRequestIndexChange = vi.fn();
        const { result } = renderHook(() => useWheel({
            orientation: "vertical",
            direction: "ltr",
            discretePaging: false,
            threshold: 10,
            debounce: 50,
            onRequestIndexChange,
        }));
        result.current.onWheel(new WheelEvent("wheel", { deltaY: 50 }));
        expect(onRequestIndexChange).not.toHaveBeenCalled();
    });
});
