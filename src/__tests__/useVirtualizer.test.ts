// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useVirtualizer } from "../hooks/useVirtualizer";

describe("useVirtualizer", () => {
  it("computes offsets and sizes in order", () => {
    const items = Array.from({ length: 3 }, (_, i) => ({ id: i }));
    const { result } = renderHook(() =>
      useVirtualizer({
        items,
        virtual: { estimatedSize: (item, idx) => 100 + idx * 10 },
        resolvedMode: "virtualized",
      }),
    );
    const offsets = result.current.map(v => v.offset);
    expect(offsets).toEqual([0, 100, 210]);
    expect(result.current.at(-1)?.size).toBe(120);
  });
});

