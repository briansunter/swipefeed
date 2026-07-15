import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App, VideoCard } from "./index";

const VIDEO_ITEM = {
  id: "test-video",
  youtubeId: "x2BwY40EYp8",
  username: "@test",
  description: "Test short",
  music: "Test sound",
  likes: "1K",
  comments: "10",
  shares: "5",
  color: "#000000",
};

describe("demo shared-player architecture", () => {
  it("renders exactly one non-interactive YouTube iframe with native controls disabled", () => {
    render(<App />);

    const iframes = screen.getAllByTitle("YouTube video player") as HTMLIFrameElement[];
    expect(iframes).toHaveLength(1);
    expect(iframes[0]).toHaveClass("pointer-events-none");

    const url = new URL(iframes[0].src);
    expect(url.searchParams.get("controls")).toBe("0");
    expect(url.searchParams.get("playsinline")).toBe("1");
    expect(url.searchParams.get("autoplay")).toBe("1");
    expect(url.searchParams.get("mute")).toBe("1");
  });

  it("moves the same iframe with the swipe instead of recreating it", async () => {
    render(<App />);
    const iframe = screen.getByTitle("YouTube video player");
    const feed = screen.getByRole("feed", { name: "Swipe feed" });
    const player = screen.getByTestId("shared-youtube-player");

    Object.defineProperty(feed, "clientHeight", { configurable: true, value: 1000 });
    fireEvent.scroll(feed, { target: { scrollTop: 600 } });

    await waitFor(() => {
      expect(player).toHaveStyle({ transform: "translate3d(0, 400px, 0)" });
    });
    expect(screen.getByTitle("YouTube video player")).toBe(iframe);
  });

  it("hands the poster off without putting an opaque card over the player", () => {
    const { rerender } = render(<VideoCard item={VIDEO_ITEM} isPlaying={false} />);

    const card = screen.getByTestId("video-card-test-video");
    const poster = screen.getByTestId("video-poster-test-video");
    expect(card).not.toHaveClass("bg-black");
    expect(poster).toHaveClass("opacity-100");

    rerender(<VideoCard item={VIDEO_ITEM} isPlaying />);

    expect(card).not.toHaveClass("bg-black");
    expect(poster).toHaveClass("opacity-0");
  });
});
