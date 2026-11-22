import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { SwipeDeck } from "../components/SwipeDeck";
import type { SwipeDeckHandle, SwipeDeckMotion } from "../types";

const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("SwipeDeck motion in a real browser", () => {
  it("emits continuous motion from native scrolling and stores the same snapshot", async () => {
    const ref = createRef<SwipeDeckHandle>();
    const snapshots: SwipeDeckMotion[] = [];
    const onMotionChange = vi.fn<(motion: SwipeDeckMotion) => void>(() => {
      const snapshot = ref.current?.getMotion();
      if (snapshot) snapshots.push(snapshot);
    });
    render(
      <SwipeDeck
        ref={ref}
        items={items}
        onMotionChange={onMotionChange}
        style={{ height: "100dvh", width: "320px" }}
      >
        {({ item }) => <div>{item.id}</div>}
      </SwipeDeck>,
    );

    const viewport = screen.getByRole("feed");
    const targetOffset = viewport.clientHeight * 0.7;
    viewport.style.scrollSnapType = "none";
    await act(async () => {
      viewport.scrollTop = targetOffset;
      fireEvent.scroll(viewport);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    await waitFor(() => {
      expect(onMotionChange).toHaveBeenCalledWith(expect.objectContaining({
        index: 1,
        direction: "forward",
        isSettled: false,
      }));
    });
    // Capture in the callback, before the native settle timer can emit the next state.
    const motion = snapshots.find((snapshot) => Math.abs(snapshot.position - 0.7) < 0.01);
    expect(motion?.position).toBeCloseTo(0.7);
    expect(motion?.index).toBe(1);
    expect(motion?.offset).toBeCloseTo(
      viewport.clientHeight - (motion?.scrollOffset ?? 0),
    );
  });

  it("uses native intersection visibility to activate the incoming item", async () => {
    const onIndexChange = vi.fn();
    render(
      <SwipeDeck
        items={items}
        visibility={{ strategy: "intersection", intersectionRatio: 0.6, debounce: 0 }}
        onIndexChange={onIndexChange}
        style={{ height: "100dvh", width: "320px" }}
      >
        {({ item }) => <div>{item.id}</div>}
      </SwipeDeck>,
    );

    const viewport = screen.getByRole("feed");
    await act(async () => {
      viewport.scrollTop = viewport.clientHeight;
      fireEvent.scroll(viewport);
    });

    await waitFor(() => {
      expect(onIndexChange).toHaveBeenCalledWith(1, "visibility");
    });
  });
});
