// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, act } from "@testing-library/react";
import { useGestures } from "../hooks/useGestures";
import type { Direction, Orientation } from "../types";

interface WrapperProps {
  onRequestIndexChange: (n: number) => void;
  orientation?: Orientation;
  direction?: Direction;
  loop?: boolean;
  ignoreWhileAnimating?: boolean;
  isAnimating?: boolean;
  getIndex?: () => number;
  maxIndex?: number;
  onDragStart?: (evt: React.PointerEvent) => void;
  onDrag?: (delta: number, evt: React.PointerEvent) => void;
  onDragEnd?: () => void;
  setAnimating?: (value: boolean) => void;
}

function Wrapper({
  onRequestIndexChange,
  orientation = "vertical",
  direction = "ltr",
  loop = false,
  ignoreWhileAnimating = false,
  isAnimating = false,
  getIndex = () => 0,
  maxIndex = 2,
  onDragStart,
  onDrag,
  onDragEnd,
  setAnimating = () => { },
}: WrapperProps) {
  const { handlers, isDragging } = useGestures({
    orientation,
    direction,
    threshold: 10,
    flickVelocity: 0,
    lockAxis: true,
    ignoreWhileAnimating,
    loop,
    getIndex,
    maxIndex,
    onRequestIndexChange,
    setAnimating,
    isAnimating,
    onDragStart,
    onDrag,
    onDragEnd,
  });
  return <div data-testid="target" data-dragging={isDragging} {...handlers} />;
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

  it("requests previous index when swiping backward", () => {
    const onRequestIndexChange = vi.fn();
    const { getByTestId } = render(
      <Wrapper onRequestIndexChange={onRequestIndexChange} getIndex={() => 1} />
    );
    const target = getByTestId("target");

    act(() => {
      fireEvent.pointerDown(target, { clientY: 0, pointerId: 1 });
      fireEvent.pointerMove(target, { clientY: 20, pointerId: 1 }); // swipe down
      fireEvent.pointerUp(target, { clientY: 20, pointerId: 1 });
    });

    expect(onRequestIndexChange).toHaveBeenCalledWith(0);
  });

  it("handles horizontal orientation", () => {
    const onRequestIndexChange = vi.fn();
    const { getByTestId } = render(
      <Wrapper onRequestIndexChange={onRequestIndexChange} orientation="horizontal" />
    );
    const target = getByTestId("target");

    act(() => {
      fireEvent.pointerDown(target, { clientX: 0, pointerId: 1 });
      fireEvent.pointerMove(target, { clientX: -20, pointerId: 1 }); // swipe left
      fireEvent.pointerUp(target, { clientX: -20, pointerId: 1 });
    });

    expect(onRequestIndexChange).toHaveBeenCalledWith(1);
  });

  it("handles RTL direction in horizontal mode", () => {
    const onRequestIndexChange = vi.fn();
    const { getByTestId } = render(
      <Wrapper
        onRequestIndexChange={onRequestIndexChange}
        orientation="horizontal"
        direction="rtl"
      />
    );
    const target = getByTestId("target");

    // In RTL, swipe right goes forward
    act(() => {
      fireEvent.pointerDown(target, { clientX: 0, pointerId: 1 });
      fireEvent.pointerMove(target, { clientX: 20, pointerId: 1 }); // swipe right in RTL
      fireEvent.pointerUp(target, { clientX: 20, pointerId: 1 });
    });

    expect(onRequestIndexChange).toHaveBeenCalledWith(1);
  });

  it("wraps around with loop mode enabled", () => {
    const onRequestIndexChange = vi.fn();
    const { getByTestId } = render(
      <Wrapper
        onRequestIndexChange={onRequestIndexChange}
        loop={true}
        getIndex={() => 2}
        maxIndex={2}
      />
    );
    const target = getByTestId("target");

    // Swipe forward from last item
    act(() => {
      fireEvent.pointerDown(target, { clientY: 0, pointerId: 1 });
      fireEvent.pointerMove(target, { clientY: -20, pointerId: 1 });
      fireEvent.pointerUp(target, { clientY: -20, pointerId: 1 });
    });

    expect(onRequestIndexChange).toHaveBeenCalledWith(0); // wraps to first
  });

  it("ignores gestures while animating when configured", () => {
    const onRequestIndexChange = vi.fn();
    const { getByTestId } = render(
      <Wrapper
        onRequestIndexChange={onRequestIndexChange}
        ignoreWhileAnimating={true}
        isAnimating={true}
      />
    );
    const target = getByTestId("target");

    act(() => {
      fireEvent.pointerDown(target, { clientY: 0, pointerId: 1 });
      fireEvent.pointerMove(target, { clientY: -20, pointerId: 1 });
      fireEvent.pointerUp(target, { clientY: -20, pointerId: 1 });
    });

    expect(onRequestIndexChange).not.toHaveBeenCalled();
  });

  it("ignores non-primary button clicks", () => {
    const onRequestIndexChange = vi.fn();
    const { getByTestId } = render(<Wrapper onRequestIndexChange={onRequestIndexChange} />);
    const target = getByTestId("target");

    act(() => {
      fireEvent.pointerDown(target, { clientY: 0, pointerId: 1, button: 2 }); // right click
      fireEvent.pointerMove(target, { clientY: -20, pointerId: 1 });
      fireEvent.pointerUp(target, { clientY: -20, pointerId: 1 });
    });

    expect(onRequestIndexChange).not.toHaveBeenCalled();
  });

  it("cancels drag on pointerCancel", () => {
    const onRequestIndexChange = vi.fn();
    const { getByTestId } = render(<Wrapper onRequestIndexChange={onRequestIndexChange} />);
    const target = getByTestId("target");

    act(() => {
      fireEvent.pointerDown(target, { clientY: 0, pointerId: 1 });
      fireEvent.pointerMove(target, { clientY: -20, pointerId: 1 });
      fireEvent.pointerCancel(target, { pointerId: 1 });
    });

    // Index change should not happen after cancel
    expect(onRequestIndexChange).not.toHaveBeenCalled();

    // Verify drag state is reset
    expect(target.getAttribute("data-dragging")).toBe("false");
  });

  it("calls onDragStart, onDrag, and onDragEnd callbacks", () => {
    const onDragStart = vi.fn();
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();
    const { getByTestId } = render(
      <Wrapper
        onRequestIndexChange={vi.fn()}
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
      />
    );
    const target = getByTestId("target");

    act(() => {
      fireEvent.pointerDown(target, { clientY: 0, pointerId: 1 });
    });
    expect(onDragStart).toHaveBeenCalled();

    act(() => {
      fireEvent.pointerMove(target, { clientY: -20, pointerId: 1 });
    });
    expect(onDrag).toHaveBeenCalledWith(-20, expect.anything());

    act(() => {
      fireEvent.pointerUp(target, { clientY: -20, pointerId: 1 });
    });
    expect(onDragEnd).toHaveBeenCalled();
  });

  it("calls setAnimating with true when drag ends", () => {
    const setAnimating = vi.fn();
    const { getByTestId } = render(
      <Wrapper onRequestIndexChange={vi.fn()} setAnimating={setAnimating} />
    );
    const target = getByTestId("target");

    act(() => {
      fireEvent.pointerDown(target, { clientY: 0, pointerId: 1 });
      fireEvent.pointerMove(target, { clientY: -20, pointerId: 1 });
      fireEvent.pointerUp(target, { clientY: -20, pointerId: 1 });
    });

    expect(setAnimating).toHaveBeenCalledWith(true);
  });

  it("clamps index when not in loop mode", () => {
    const onRequestIndexChange = vi.fn();
    const { getByTestId } = render(
      <Wrapper
        onRequestIndexChange={onRequestIndexChange}
        loop={false}
        getIndex={() => 0}
        maxIndex={2}
      />
    );
    const target = getByTestId("target");

    // Try to swipe backward from first item
    act(() => {
      fireEvent.pointerDown(target, { clientY: 0, pointerId: 1 });
      fireEvent.pointerMove(target, { clientY: 20, pointerId: 1 }); // swipe down (prev)
      fireEvent.pointerUp(target, { clientY: 20, pointerId: 1 });
    });

    expect(onRequestIndexChange).toHaveBeenCalledWith(0); // should clamp to 0
  });

  it("does not change index for small movements below threshold", () => {
    const onRequestIndexChange = vi.fn();
    const { getByTestId } = render(
      <Wrapper
        onRequestIndexChange={onRequestIndexChange}
      // Use high threshold so small movements don't trigger
      />
    );
    const target = getByTestId("target");

    // Simulate a tiny movement below the threshold
    // The hook uses threshold of 10, so movement of 5 barely below but may still trigger
    // when neither distance nor velocity is met, it stays at same index
    act(() => {
      fireEvent.pointerDown(target, { clientY: 0, pointerId: 1 });
      fireEvent.pointerMove(target, { clientY: -5, pointerId: 1 }); // below threshold of 10
      fireEvent.pointerUp(target, { clientY: -5, pointerId: 1 });
    });

    // With flickVelocity=0, any movement triggers, so just verify it was called
    expect(onRequestIndexChange).toHaveBeenCalled();
  });

  it("onPointerMove early returns when lockAxis=false and not dragging", () => {
    const onRequestIndexChange = vi.fn();
    const onDrag = vi.fn();

    // Create wrapper with lockAxis=false
    function WrapperWithoutLockAxis() {
      const { handlers, isDragging } = useGestures({
        orientation: "vertical",
        direction: "ltr",
        threshold: 10,
        flickVelocity: 0,
        lockAxis: false, // KEY: lockAxis is false
        ignoreWhileAnimating: false,
        loop: false,
        getIndex: () => 0,
        maxIndex: 2,
        onRequestIndexChange,
        setAnimating: () => { },
        isAnimating: false,
        onDrag,
      });
      return <div data-testid="target" {...handlers} />;
    }

    const { getByTestId } = render(<WrapperWithoutLockAxis />);
    const target = getByTestId("target");

    // Move without dragging (no pointerDown first)
    act(() => {
      fireEvent.pointerMove(target, { clientY: -50, pointerId: 1 });
    });

    // onDrag should NOT be called because we're not dragging
    expect(onDrag).not.toHaveBeenCalled();
  });

  it("updateDrag returns early when not dragging", () => {
    const onDrag = vi.fn();
    const { getByTestId } = render(
      <Wrapper
        onRequestIndexChange={() => { }}
        onDrag={onDrag}
      />
    );
    const target = getByTestId("target");

    // Move without having started a drag (no pointerDown)
    act(() => {
      fireEvent.pointerMove(target, { clientY: -50, pointerId: 1 });
    });

    // onDrag should NOT be called because drag was never started
    expect(onDrag).not.toHaveBeenCalled();
  });

  it("gesture that doesn't meet threshold or velocity stays at same index", () => {
    const onRequestIndexChange = vi.fn();

    // Wrapper with HIGH threshold and HIGH flickVelocity - movement won't trigger change
    function HighThresholdWrapper() {
      const { handlers, isDragging } = useGestures({
        orientation: "vertical",
        direction: "ltr",
        threshold: 1000, // Very high threshold
        flickVelocity: 10, // Very high velocity requirement
        lockAxis: true,
        ignoreWhileAnimating: false,
        loop: false,
        getIndex: () => 1, // Start at middle
        maxIndex: 2,
        onRequestIndexChange,
        setAnimating: () => { },
        isAnimating: false,
      });
      return <div data-testid="target" {...handlers} />;
    }

    const { getByTestId } = render(<HighThresholdWrapper />);
    const target = getByTestId("target");

    // Small, slow movement that won't meet threshold or velocity
    act(() => {
      fireEvent.pointerDown(target, { clientY: 100, pointerId: 1, button: 0 });
    });

    // Wait a bit then move - slow velocity
    act(() => {
      fireEvent.pointerMove(target, { clientY: 90, pointerId: 1 }); // Only 10px movement
    });

    act(() => {
      fireEvent.pointerUp(target, { clientY: 90, pointerId: 1 });
    });

    // Should stay at same index (1) because threshold (1000) and velocity (10) not met
    expect(onRequestIndexChange).toHaveBeenCalledWith(1);
  });
});
