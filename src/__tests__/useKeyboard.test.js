// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboard } from "../hooks/useKeyboard";
describe("useKeyboard", () => {
    it("supports altPrev/altNext bindings", () => {
        const onPrev = vi.fn();
        const onNext = vi.fn();
        const { result } = renderHook(() => useKeyboard({
            orientation: "vertical",
            direction: "ltr",
            config: { enabled: true, bindings: { altPrev: ["k"], altNext: ["j"] } },
            onPrev,
            onNext,
        }));
        result.current.onKeyDown(new KeyboardEvent("keydown", { key: "k" }));
        result.current.onKeyDown(new KeyboardEvent("keydown", { key: "j" }));
        expect(onPrev).toHaveBeenCalled();
        expect(onNext).toHaveBeenCalled();
    });
});
