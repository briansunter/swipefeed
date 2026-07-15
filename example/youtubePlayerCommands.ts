export const YOUTUBE_ORIGIN = "https://www.youtube.com";

type YouTubeCommand = "mute" | "unMute" | "playVideo" | "pauseVideo";
type YouTubeMessageTarget = Pick<Window, "postMessage">;

export const sendYouTubeCommand = (
  target: YouTubeMessageTarget,
  command: YouTubeCommand,
) => {
  target.postMessage(
    JSON.stringify({ event: "command", func: command, args: [] }),
    YOUTUBE_ORIGIN,
  );
};

export const syncYouTubePlayback = (
  target: YouTubeMessageTarget,
  { isMuted, shouldPlay }: { isMuted: boolean; shouldPlay: boolean },
) => {
  sendYouTubeCommand(target, isMuted ? "mute" : "unMute");

  if (shouldPlay) {
    sendYouTubeCommand(target, "playVideo");
  }
};
