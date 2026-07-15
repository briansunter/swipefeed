import { describe, expect, it } from "vitest";
import { YOUTUBE_IDS } from "./videoCatalog";

const REJECTED_DEMO_IDS = new Set([
  "6Wk_rydOz6Y",
  "Wi_f2dR9Frg",
  "EEGJMnqHT7Q",
  "jUvgToe3pNE",
  "6ydY6k-BGk0",
  "1C-StoezvXQ",
  "nanZ2ZFE5RM",
  "37F_-KvfC68",
  "RlBE1zuXseE",
  "oJ6mC4DsOM4",
]);

describe("demo video catalog", () => {
  it("contains enough videos to exercise sustained swiping", () => {
    expect(YOUTUBE_IDS.length).toBeGreaterThanOrEqual(20);
  });

  it("contains only unique, syntactically valid YouTube IDs", () => {
    expect(new Set(YOUTUBE_IDS).size).toBe(YOUTUBE_IDS.length);
    expect(YOUTUBE_IDS.every((id) => /^[\w-]{11}$/.test(id))).toBe(true);
  });

  it("does not reintroduce IDs verified as blocked or letterboxed", () => {
    expect(YOUTUBE_IDS.filter((id) => REJECTED_DEMO_IDS.has(id))).toEqual([]);
  });
});
