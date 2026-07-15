import { describe, expect, it } from "vitest";
import { calculateSwipeDeckMotion } from "../motion";

describe("calculateSwipeDeckMotion", () => {
  it("tracks continuous forward motion before the midpoint", () => {
    expect(calculateSwipeDeckMotion({
      scrollOffset: 300,
      viewportSize: 1000,
      itemCount: 4,
      previousScrollOffset: 0,
    })).toEqual({
      scrollOffset: 300,
      viewportSize: 1000,
      position: 0.3,
      index: 0,
      offset: -300,
      offsetRatio: -0.3,
      direction: "forward",
      isSettled: false,
    });
  });

  it("hands motion to the incoming item at the midpoint", () => {
    expect(calculateSwipeDeckMotion({
      scrollOffset: 500,
      viewportSize: 1000,
      itemCount: 4,
      previousScrollOffset: 499,
    })).toMatchObject({
      position: 0.5,
      index: 1,
      offset: 500,
      offsetRatio: 0.5,
      direction: "forward",
      isSettled: false,
    });
  });

  it("keeps the outgoing item immediately before the midpoint", () => {
    expect(calculateSwipeDeckMotion({
      scrollOffset: 499.99,
      viewportSize: 1000,
      itemCount: 4,
      previousScrollOffset: 400,
    })).toMatchObject({
      position: 0.49999,
      index: 0,
      offset: -499.99,
      direction: "forward",
    });
  });

  it("tracks reverse motion and settled positions", () => {
    expect(calculateSwipeDeckMotion({
      scrollOffset: 1300,
      viewportSize: 1000,
      itemCount: 4,
      previousScrollOffset: 1600,
    })).toMatchObject({
      position: 1.3,
      index: 1,
      offset: -300,
      direction: "backward",
      isSettled: false,
    });

    expect(calculateSwipeDeckMotion({
      scrollOffset: 2000,
      viewportSize: 1000,
      itemCount: 4,
      previousScrollOffset: 1300,
    })).toMatchObject({
      position: 2,
      index: 2,
      offset: 0,
      direction: "forward",
      isSettled: true,
    });
  });

  it("clamps iOS rubber-band scrolling at both ends", () => {
    expect(calculateSwipeDeckMotion({
      scrollOffset: -120,
      viewportSize: 1000,
      itemCount: 4,
      previousScrollOffset: 0,
    })).toMatchObject({
      scrollOffset: 0,
      position: 0,
      index: 0,
      offset: 0,
      isSettled: true,
    });

    expect(calculateSwipeDeckMotion({
      scrollOffset: 3900,
      viewportSize: 1000,
      itemCount: 4,
      previousScrollOffset: 3000,
    })).toMatchObject({
      scrollOffset: 3000,
      position: 3,
      index: 3,
      offset: 0,
      isSettled: true,
    });
  });

  it("returns a stable snapshot for invalid geometry", () => {
    expect(calculateSwipeDeckMotion({
      scrollOffset: Number.NaN,
      viewportSize: 0,
      itemCount: 0,
      previousScrollOffset: Number.NaN,
    })).toEqual({
      scrollOffset: 0,
      viewportSize: 0,
      position: 0,
      index: 0,
      offset: 0,
      offsetRatio: 0,
      direction: "none",
      isSettled: true,
    });
  });

  it.each([
    [0, 4],
    [-100, 4],
    [Number.NaN, 4],
    [Number.POSITIVE_INFINITY, 4],
    [1000, 0],
    [1000, -1],
    [1000, Number.NaN],
  ])("stabilizes invalid viewport/item geometry (%s, %s)", (size, count) => {
    expect(calculateSwipeDeckMotion({
      scrollOffset: 500,
      viewportSize: size,
      itemCount: count,
      previousScrollOffset: 0,
    })).toEqual({
      scrollOffset: 0,
      viewportSize: 0,
      position: 0,
      index: 0,
      offset: 0,
      offsetRatio: 0,
      direction: "none",
      isSettled: true,
    });
  });
});
