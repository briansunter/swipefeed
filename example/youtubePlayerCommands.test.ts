import { describe, expect, it, vi } from "vitest";
import { syncYouTubePlayback } from "./youtubePlayerCommands";

const decodedCommands = (postMessage: ReturnType<typeof vi.fn>) =>
  postMessage.mock.calls.map(([message, targetOrigin]) => ({
    command: JSON.parse(message as string).func,
    targetOrigin,
  }));

describe("syncYouTubePlayback", () => {
  it("unmutes and resumes playback as one synchronous user action", () => {
    const postMessage = vi.fn();

    syncYouTubePlayback({ postMessage }, { isMuted: false, shouldPlay: true });

    expect(decodedCommands(postMessage)).toEqual([
      { command: "unMute", targetOrigin: "https://www.youtube.com" },
      { command: "playVideo", targetOrigin: "https://www.youtube.com" },
    ]);
  });

  it("can mute a preloaded player without starting it", () => {
    const postMessage = vi.fn();

    syncYouTubePlayback({ postMessage }, { isMuted: true, shouldPlay: false });

    expect(decodedCommands(postMessage)).toEqual([
      { command: "mute", targetOrigin: "https://www.youtube.com" },
    ]);
  });
});
