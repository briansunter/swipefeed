import { describe, expect, it, vi } from "vitest";
import {
  getYouTubeEmbedUrl,
  parseYouTubePlayerMessage,
  sendYouTubeCommand,
  shouldRetryYouTubePlayback,
  syncYouTubePlayback,
  YOUTUBE_ORIGIN,
  type YouTubeCommand,
} from "./youtubePlayerCommands";

const decodedCommands = (postMessage: ReturnType<typeof vi.fn>) =>
  postMessage.mock.calls.map(([message, targetOrigin]) => ({
    ...JSON.parse(message as string),
    targetOrigin,
  }));

describe("sendYouTubeCommand", () => {
  it.each<[YouTubeCommand, unknown[]]>([
    ["loadVideoById", ["next-video"]],
    ["mute", []],
    ["pauseVideo", []],
    ["playVideo", []],
    ["setVolume", [100]],
    ["unMute", []],
  ])("sends %s to the existing YouTube iframe", (command, args) => {
    const postMessage = vi.fn();

    sendYouTubeCommand({ postMessage }, command, args);

    expect(decodedCommands(postMessage)).toEqual([
      {
        event: "command",
        func: command,
        args,
        targetOrigin: YOUTUBE_ORIGIN,
      },
    ]);
  });

  it("defaults to an empty argument list and never uses a wildcard origin", () => {
    const postMessage = vi.fn();

    sendYouTubeCommand({ postMessage }, "playVideo");

    expect(decodedCommands(postMessage)).toEqual([
      {
        event: "command",
        func: "playVideo",
        args: [],
        targetOrigin: YOUTUBE_ORIGIN,
      },
    ]);
  });
});

describe("syncYouTubePlayback", () => {
  it("restores volume and playback when the user unmutes", () => {
    const postMessage = vi.fn();

    syncYouTubePlayback({ postMessage }, { isMuted: false, shouldPlay: true });

    expect(decodedCommands(postMessage)).toEqual([
      { event: "command", func: "unMute", args: [], targetOrigin: "https://www.youtube.com" },
      { event: "command", func: "setVolume", args: [100], targetOrigin: "https://www.youtube.com" },
      { event: "command", func: "playVideo", args: [], targetOrigin: "https://www.youtube.com" },
    ]);
  });

  it("can mute without starting playback", () => {
    const postMessage = vi.fn();

    syncYouTubePlayback({ postMessage }, { isMuted: true, shouldPlay: false });

    expect(decodedCommands(postMessage)).toEqual([
      { event: "command", func: "mute", args: [], targetOrigin: "https://www.youtube.com" },
    ]);
  });

  it("can restore audible volume without forcing playback", () => {
    const postMessage = vi.fn();

    syncYouTubePlayback({ postMessage }, { isMuted: false, shouldPlay: false });

    expect(decodedCommands(postMessage)).toEqual([
      { event: "command", func: "unMute", args: [], targetOrigin: YOUTUBE_ORIGIN },
      { event: "command", func: "setVolume", args: [100], targetOrigin: YOUTUBE_ORIGIN },
    ]);
  });

  it("can keep muted autoplay running", () => {
    const postMessage = vi.fn();

    syncYouTubePlayback({ postMessage }, { isMuted: true, shouldPlay: true });

    expect(decodedCommands(postMessage)).toEqual([
      { event: "command", func: "mute", args: [], targetOrigin: YOUTUBE_ORIGIN },
      { event: "command", func: "playVideo", args: [], targetOrigin: YOUTUBE_ORIGIN },
    ]);
  });
});

describe("parseYouTubePlayerMessage", () => {
  it.each([
    [{ event: "onReady" }, { type: "ready" }],
    [{ event: "onStateChange", info: 1 }, { type: "state", state: 1 }],
    [{ event: "infoDelivery", info: { playerState: 3 } }, { type: "state", state: 3 }],
    [{ event: "onError", info: 150 }, { type: "error", code: 150 }],
  ])("parses supported player messages", (message, expected) => {
    expect(parseYouTubePlayerMessage(message)).toEqual(expected);
    expect(parseYouTubePlayerMessage(JSON.stringify(message))).toEqual(expected);
  });

  it.each([
    null,
    undefined,
    "not-json",
    [],
    { event: "unknown" },
    { event: "onStateChange", info: "1" },
    { event: "onError", info: "150" },
  ])("ignores malformed or irrelevant messages", (message) => {
    expect(parseYouTubePlayerMessage(message)).toBeNull();
  });
});

describe("shouldRetryYouTubePlayback", () => {
  it.each([null, -1, 0, 2, 5])("retries stalled state %s", (playerState) => {
    expect(shouldRetryYouTubePlayback({ isApiReady: true, playerState, playerError: null })).toBe(true);
  });

  it.each([1, 3])("does not interrupt healthy state %s", (playerState) => {
    expect(shouldRetryYouTubePlayback({ isApiReady: true, playerState, playerError: null })).toBe(false);
  });

  it("does not retry before the API is ready", () => {
    expect(shouldRetryYouTubePlayback({ isApiReady: false, playerState: null, playerError: null })).toBe(false);
  });

  it("does not retry an unavailable video forever", () => {
    expect(shouldRetryYouTubePlayback({ isApiReady: true, playerState: null, playerError: 150 })).toBe(false);
  });
});

describe("getYouTubeEmbedUrl", () => {
  it("keeps the iOS autoplay and native-control invariants", () => {
    const url = new URL(getYouTubeEmbedUrl("video-id"));

    expect(url.origin).toBe(YOUTUBE_ORIGIN);
    expect(url.pathname).toBe("/embed/video-id");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      autoplay: "1",
      controls: "0",
      enablejsapi: "1",
      fs: "0",
      loop: "1",
      mute: "1",
      playlist: "video-id",
      playsinline: "1",
    });
    expect(url.searchParams.has("origin")).toBe(false);
  });
});
