// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, act } from "@testing-library/react";
import { useGestures } from "../hooks/useGestures";

function Wrapper({ onRequestIndexChange }: { onRequestIndexChange: (n: number) => void }) {
  const { handlers } = useGestures({
    orientation: "vertical",
    direction: "ltr",
    threshold: 10,
    flickVelocity: 0,
    lockAxis: true,
    ignoreWhileAnimating: false,
    loop: false,
    getIndex: () => 0,
    maxIndex: 2,
    onRequestIndexChange,
    setAnimating: () => { },
    isAnimating: false,
  });
  return <div data-testid="target" {...handlers} />;
}

describe("useGestures", () => {
  it("requests next index on flick/threshold", () => {
    const onRequestIndexChange = vi.fn();
    const { getByTestId } = render(<Wrapper onRequestIndexChange={onRequestIndexChange} />);
    const target = getByTestId("target");

    act(() => {
      fireEvent.pointerDown(target, { clientY: 0, pointerId: 1 });
      fireEvent.pointerMove(target, { clientY: -20, pointerId: 1 });
      fireEvent.pointerUp(target, { clientY: -20, pointerId: 1 });
    });

    expect(onRequestIndexChange).toHaveBeenCalledWith(1);
  });
});

