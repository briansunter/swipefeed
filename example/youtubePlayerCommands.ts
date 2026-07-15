export const YOUTUBE_ORIGIN = "https://www.youtube.com";

export type YouTubeCommand =
  | "loadVideoById"
  | "mute"
  | "pauseVideo"
  | "playVideo"
  | "setVolume"
  | "unMute";

export type YouTubeMessageTarget = Pick<Window, "postMessage">;

export type YouTubePlayerUpdate =
  | { type: "error"; code: number }
  | { type: "ready" }
  | { type: "state"; state: number };

export const sendYouTubeCommand = (
  target: YouTubeMessageTarget,
  command: YouTubeCommand,
  args: unknown[] = [],
) => {
  target.postMessage(
    JSON.stringify({ event: "command", func: command, args }),
    YOUTUBE_ORIGIN,
  );
};

export const syncYouTubePlayback = (
  target: YouTubeMessageTarget,
  { isMuted, shouldPlay }: { isMuted: boolean; shouldPlay: boolean },
) => {
  sendYouTubeCommand(target, isMuted ? "mute" : "unMute");
  if (!isMuted) sendYouTubeCommand(target, "setVolume", [100]);
  if (shouldPlay) sendYouTubeCommand(target, "playVideo");
};

export const parseYouTubePlayerMessage = (
  message: unknown,
): YouTubePlayerUpdate | null => {
  let data: unknown = message;

  if (typeof message === "string") {
    try {
      data = JSON.parse(message);
    } catch {
      return null;
    }
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) return null;

  const event = (data as { event?: unknown }).event;
  const info = (data as { info?: unknown }).info;

  if (event === "onReady") return { type: "ready" };
  if (event === "onStateChange" && typeof info === "number") {
    return { type: "state", state: info };
  }
  if (event === "onError" && typeof info === "number") {
    return { type: "error", code: info };
  }
  if (
    event === "infoDelivery"
    && info
    && typeof info === "object"
    && typeof (info as { playerState?: unknown }).playerState === "number"
  ) {
    return {
      type: "state",
      state: (info as { playerState: number }).playerState,
    };
  }

  return null;
};

export const shouldRetryYouTubePlayback = ({
  isApiReady,
  playerError,
  playerState,
}: {
  isApiReady: boolean;
  playerError: number | null;
  playerState: number | null;
}) => isApiReady && playerError === null && playerState !== 1 && playerState !== 3;

export const getYouTubeEmbedUrl = (youtubeId: string) => {
  const params = new URLSearchParams({
    enablejsapi: "1",
    autoplay: "1",
    mute: "1",
    controls: "0",
    modestbranding: "1",
    rel: "0",
    showinfo: "0",
    loop: "1",
    playlist: youtubeId,
    playsinline: "1",
    iv_load_policy: "3",
    fs: "0",
    disablekb: "1",
    cc_load_policy: "0",
  });

  return `${YOUTUBE_ORIGIN}/embed/${encodeURIComponent(youtubeId)}?${params}`;
};
