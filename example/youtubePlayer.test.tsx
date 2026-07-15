import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { YouTubePlayer, type PlayerAudioController } from "./index";
import { YOUTUBE_ORIGIN } from "./youtubePlayerCommands";

const TEST_IDS = [
  "x2BwY40EYp8",
  "tUiFUJFQZKo",
  "gcPJH-qQ7To",
  "qK38nPgaQ2U",
  "TcIjPPrwX4U",
  "LCqBUv5TJ0U",
  "MkJgqkp_DRM",
];

const commandCalls = (postMessage: ReturnType<typeof vi.spyOn>) =>
  postMessage.mock.calls
    .map(([message, targetOrigin]) => ({
      ...(typeof message === "string" ? JSON.parse(message) : {}),
      targetOrigin,
    }))
    .filter((message) => message.event === "command");

const dispatchPlayerMessage = (
  iframe: HTMLIFrameElement,
  data: unknown,
  origin = YOUTUBE_ORIGIN,
) => {
  window.dispatchEvent(new MessageEvent("message", {
    data: JSON.stringify(data),
    origin,
    source: iframe.contentWindow,
  }));
};

describe("YouTubePlayer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps one iframe alive through a long sequence of video changes", async () => {
    const registerPlayer = vi.fn(() => vi.fn());
    const { rerender } = render(
      <YouTubePlayer youtubeId={TEST_IDS[0]} isMuted registerPlayer={registerPlayer} />,
    );
    const iframe = screen.getByTitle("YouTube video player") as HTMLIFrameElement;
    const initialSrc = iframe.src;
    const postMessage = vi.spyOn(iframe.contentWindow as Window, "postMessage");

    fireEvent.load(iframe);
    postMessage.mockClear();

    for (const youtubeId of TEST_IDS.slice(1)) {
      rerender(<YouTubePlayer youtubeId={youtubeId} isMuted registerPlayer={registerPlayer} />);
      await act(async () => vi.advanceTimersByTime(100));
      expect(screen.getByTitle("YouTube video player")).toBe(iframe);
      expect(iframe.src).toBe(initialSrc);
      expect(screen.getByTestId("youtube-player")).toHaveAttribute("data-youtube-id", youtubeId);
    }

    expect(commandCalls(postMessage).filter(({ func }) => func === "loadVideoById"))
      .toEqual(TEST_IDS.slice(1).map((youtubeId) => ({
        event: "command",
        func: "loadVideoById",
        args: [youtubeId],
        targetOrigin: YOUTUBE_ORIGIN,
      })));
  });

  it("sends unmute, full volume, and play synchronously in the user gesture", () => {
    const registration: { current: PlayerAudioController | null } = { current: null };
    const registerPlayer = vi.fn((nextController: PlayerAudioController) => {
      registration.current = nextController;
      return () => {
        if (registration.current === nextController) registration.current = null;
      };
    });
    render(<YouTubePlayer youtubeId={TEST_IDS[0]} isMuted registerPlayer={registerPlayer} />);
    const iframe = screen.getByTitle("YouTube video player") as HTMLIFrameElement;
    const postMessage = vi.spyOn(iframe.contentWindow as Window, "postMessage");

    fireEvent.load(iframe);
    postMessage.mockClear();

    const activeController = registration.current;
    expect(activeController).not.toBeNull();
    if (!activeController) throw new Error("Player controller did not register");
    expect(activeController(false)).toBe(true);
    expect(commandCalls(postMessage)).toEqual([
      { event: "command", func: "unMute", args: [], targetOrigin: YOUTUBE_ORIGIN },
      { event: "command", func: "setVolume", args: [100], targetOrigin: YOUTUBE_ORIGIN },
      { event: "command", func: "playVideo", args: [], targetOrigin: YOUTUBE_ORIGIN },
    ]);
  });

  it("waits for playing state before reapplying audible audio after a swipe", async () => {
    const registerPlayer = vi.fn(() => vi.fn());
    const { rerender } = render(
      <YouTubePlayer youtubeId={TEST_IDS[0]} isMuted={false} registerPlayer={registerPlayer} />,
    );
    const iframe = screen.getByTitle("YouTube video player") as HTMLIFrameElement;
    const postMessage = vi.spyOn(iframe.contentWindow as Window, "postMessage");

    fireEvent.load(iframe);
    postMessage.mockClear();
    rerender(<YouTubePlayer youtubeId={TEST_IDS[1]} isMuted={false} registerPlayer={registerPlayer} />);
    await act(async () => vi.advanceTimersByTime(100));

    expect(commandCalls(postMessage).map(({ func }) => func)).toEqual(["loadVideoById"]);

    act(() => dispatchPlayerMessage(iframe, { event: "onStateChange", info: 1 }));
    await act(async () => vi.advanceTimersByTime(150));

    expect(commandCalls(postMessage).map(({ func }) => func)).toEqual([
      "loadVideoById",
      "unMute",
      "setVolume",
    ]);
    expect(screen.getByTestId("youtube-player")).toHaveAttribute("data-player-state", "1");
  });

  it("shows a terminal fallback and stops retrying when YouTube rejects a video", async () => {
    const registerPlayer = vi.fn(() => vi.fn());
    const { rerender } = render(
      <YouTubePlayer youtubeId={TEST_IDS[0]} isMuted registerPlayer={registerPlayer} />,
    );
    const iframe = screen.getByTitle("YouTube video player") as HTMLIFrameElement;
    const postMessage = vi.spyOn(iframe.contentWindow as Window, "postMessage");

    fireEvent.load(iframe);
    rerender(<YouTubePlayer youtubeId={TEST_IDS[1]} isMuted registerPlayer={registerPlayer} />);
    await act(async () => vi.advanceTimersByTime(100));
    postMessage.mockClear();

    act(() => dispatchPlayerMessage(iframe, { event: "onError", info: 150 }));
    await act(async () => vi.advanceTimersByTime(5000));

    expect(screen.getByRole("status")).toHaveTextContent("Video unavailable");
    expect(screen.queryByTestId("youtube-loading-spinner")).not.toBeInTheDocument();
    expect(screen.getByTestId("youtube-player")).toHaveAttribute("data-player-error", "150");
    expect(commandCalls(postMessage).filter(({ func }) => func === "playVideo")).toEqual([]);
  });

  it("ignores forged state messages from another origin", async () => {
    const registerPlayer = vi.fn(() => vi.fn());
    const { rerender } = render(
      <YouTubePlayer youtubeId={TEST_IDS[0]} isMuted={false} registerPlayer={registerPlayer} />,
    );
    const iframe = screen.getByTitle("YouTube video player") as HTMLIFrameElement;
    const postMessage = vi.spyOn(iframe.contentWindow as Window, "postMessage");

    fireEvent.load(iframe);
    rerender(<YouTubePlayer youtubeId={TEST_IDS[1]} isMuted={false} registerPlayer={registerPlayer} />);
    await act(async () => vi.advanceTimersByTime(100));
    postMessage.mockClear();

    act(() => dispatchPlayerMessage(iframe, { event: "onStateChange", info: 1 }, "https://example.com"));
    await act(async () => vi.advanceTimersByTime(150));

    expect(commandCalls(postMessage).filter(({ func }) => func === "unMute")).toEqual([]);
  });

  it("cleans up delayed commands when unmounted", async () => {
    const registerPlayer = vi.fn(() => vi.fn());
    const { rerender, unmount } = render(
      <YouTubePlayer youtubeId={TEST_IDS[0]} isMuted registerPlayer={registerPlayer} />,
    );
    const iframe = screen.getByTitle("YouTube video player") as HTMLIFrameElement;
    const postMessage = vi.spyOn(iframe.contentWindow as Window, "postMessage");

    fireEvent.load(iframe);
    rerender(<YouTubePlayer youtubeId={TEST_IDS[1]} isMuted registerPlayer={registerPlayer} />);
    unmount();
    await act(async () => vi.runAllTimers());

    expect(commandCalls(postMessage).filter(({ func }) => func === "loadVideoById")).toEqual([]);
  });
});
