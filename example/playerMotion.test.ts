import { describe, expect, it } from "vitest";
import { getPlayerMotion } from "./playerMotion";

describe("getPlayerMotion", () => {
  it("moves the outgoing video up with its card before the midpoint", () => {
    expect(getPlayerMotion(300, 1000, 4)).toEqual({ index: 0, offset: -300 });
  });

  it("moves the incoming video into place after the midpoint", () => {
    expect(getPlayerMotion(700, 1000, 4)).toEqual({ index: 1, offset: 300 });
  });

  it("centers the video when scrolling settles", () => {
    expect(getPlayerMotion(2000, 1000, 4)).toEqual({ index: 2, offset: 0 });
  });

  it("hands off to the incoming video exactly at the midpoint", () => {
    expect(getPlayerMotion(500, 1000, 4)).toEqual({ index: 1, offset: 500 });
  });

  it("keeps the outgoing video immediately before the midpoint", () => {
    expect(getPlayerMotion(499.99, 1000, 4)).toEqual({
      index: 0,
      offset: -499.99,
    });
  });

  it("works in reverse while swiping back to the previous video", () => {
    expect(getPlayerMotion(1300, 1000, 4)).toEqual({
      index: 1,
      offset: -300,
    });
  });

  it("clamps iOS rubber-band scrolling above the first video", () => {
    expect(getPlayerMotion(-120, 1000, 4)).toEqual({ index: 0, offset: 0 });
  });

  it("clamps overscroll beyond the final video", () => {
    expect(getPlayerMotion(3900, 1000, 4)).toEqual({ index: 3, offset: 0 });
  });

  it.each([
    [0, 4],
    [-100, 4],
    [Number.NaN, 4],
    [Number.POSITIVE_INFINITY, 4],
    [1000, 0],
    [1000, -1],
  ])("returns a stable origin for invalid geometry (%s, %s)", (height, count) => {
    expect(getPlayerMotion(500, height, count)).toEqual({ index: 0, offset: 0 });
  });

  it("treats a non-finite scroll position as the first video", () => {
    expect(getPlayerMotion(Number.NaN, 1000, 4)).toEqual({
      index: 0,
      offset: 0,
    });
  });
});
