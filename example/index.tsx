import { createRoot } from "react-dom/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { SwipeDeck, type IndexChangeSource, type SwipeDeckMotion } from "../src";
import "./index.css";
import {
  getYouTubeEmbedUrl,
  parseYouTubePlayerMessage,
  sendYouTubeCommand,
  shouldRetryYouTubePlayback,
  syncYouTubePlayback,
} from "./youtubePlayerCommands";
import { YOUTUBE_IDS } from "./videoCatalog";

// --- Icons ---
import HomeOutline from "./icons/home-outline.svg";
import HomeFilled from "./icons/home-filled.svg";
import FriendsOutline from "./icons/friends-outline.svg";
import FriendsFilled from "./icons/friends-filled.svg";
import InboxOutline from "./icons/inbox-outline.svg";
import ProfileOutline from "./icons/profile-outline.svg";
import ProfileFilled from "./icons/profile-filled.svg";
import PlusIcon from "./icons/plus.svg";

import HeartIcon from "./icons/heart.svg";
import CommentIcon from "./icons/comment.svg";
import BookmarkIcon from "./icons/bookmark.svg";
import ShareIcon from "./icons/share.svg";
import MusicIcon from "./icons/music.svg";
import VolumeOffIcon from "./icons/volume-off.svg";
import VolumeUpIcon from "./icons/volume-up.svg";

// --- Types & Data ---

type VideoItem = {
  id: string;
  youtubeId: string;
  username: string;
  description: string;
  music: string;
  likes: string;
  comments: string;
  shares: string;
  color: string;
};

export type PlayerAudioController = (isMuted: boolean) => boolean;
type RegisterPlayer = (controller: PlayerAudioController) => () => void;
type PlaybackReadyChange = (youtubeId: string, isReady: boolean) => void;

const COLOR_PALETTE = ["#4CAF50", "#FF9800", "#E91E63", "#9C27B0", "#2196F3"];

const items: VideoItem[] = YOUTUBE_IDS.map((youtubeId, i) => ({
  id: `video-${i + 1}`,
  youtubeId,
  username: `@short_${i + 1}`,
  description: `User provided short #${i + 1}`,
  music: `Sound ${i + 1}`,
  likes: `${(Math.random() * 500).toFixed(1)}K`,
  comments: `${Math.floor(Math.random() * 1000)}`,
  shares: `${Math.floor(Math.random() * 500)}`,
  color: COLOR_PALETTE[i % COLOR_PALETTE.length],
}));

// --- UI Components ---

const ActionButton = ({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) => (
  <button type="button" className="flex flex-col items-center bg-transparent border-none cursor-pointer p-0 mb-3.5 transition-opacity duration-200 active:opacity-70 active:scale-95" onClick={onClick}>
    <div className="w-10 h-10 flex items-center justify-center mb-0.5 drop-shadow-md filter shadow-black">
      <img src={icon} alt={label} className="w-[28px] h-[28px] object-contain drop-shadow-md" />
    </div>
    <span className="text-white text-[11px] font-semibold drop-shadow-md tracking-wide text-center">{label}</span>
  </button>
);

const NavButton = ({ outlineIcon, filledIcon, label, isActive }: { outlineIcon: string; filledIcon: string; label: string; isActive?: boolean }) => (
  <button type="button" className={`flex-1 flex flex-col items-center justify-center bg-transparent border-none cursor-pointer gap-[3px] ${isActive ? 'text-white' : 'text-[#999]'}`}>
    <img src={isActive ? filledIcon : outlineIcon} alt={label} className={`w-[26px] h-[26px] ${isActive ? 'opacity-100' : 'opacity-50'}`} />
    <span className="text-[9px] font-semibold tracking-wide">{label}</span>
  </button>
);

const MuteButton = ({ isMuted, toggleMute }: { isMuted: boolean; toggleMute: () => void }) => (
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); toggleMute(); }}
    className="absolute left-4 top-4 z-[9999] w-8 h-8 bg-black/35 rounded-full backdrop-blur-sm border border-white/20 flex items-center justify-center cursor-pointer pointer-events-auto"
  >
    <img src={isMuted ? VolumeOffIcon : VolumeUpIcon} alt={isMuted ? "Unmute" : "Mute"} className="w-[18px] h-[18px]" />
  </button>
);

// --- Layout Components ---

const Header = () => (
  <header className="absolute top-0 w-full flex justify-center items-center z-50 pt-2.5 pointer-events-none">
    <div className="pointer-events-auto flex items-baseline text-white">
      <span className="text-[17px] font-semibold drop-shadow-md opacity-70">Following</span>
      <span className="opacity-30 mx-3 text-[14px]">|</span>
      <span className="text-[18px] font-bold drop-shadow-md border-b-[3px] border-white pb-1.5 -mb-1.5">For You</span>
    </div>
  </header>
);

const BottomNav = () => (
  <nav className="absolute h-[48px] bottom-0 w-full z-50 pointer-events-none flex justify-center pb-[env(safe-area-inset-bottom,20px)] bg-black border-t border-white/15">
    <div className="w-full max-w-[400px] pointer-events-auto flex justify-between items-center px-2 h-full">
      <NavButton outlineIcon={HomeOutline} filledIcon={HomeFilled} label="Home" isActive />
      <NavButton outlineIcon={FriendsOutline} filledIcon={FriendsFilled} label="Friends" />
      <div className="flex items-center justify-center flex-1">
        <button type="button" className="w-[38px] h-[26px] relative flex items-center justify-center active:scale-90 transition-transform cursor-pointer">
          <div className="absolute left-0 top-[1px] w-[32px] h-[24px] bg-[#25F4EE] rounded-[6px] transform translate-x-[-2px]" />
          <div className="absolute right-0 top-[1px] w-[32px] h-[24px] bg-[#FE2C55] rounded-[6px] transform translate-x-[2px]" />
          <div className="absolute left-[3px] top-[1px] w-[32px] h-[24px] bg-white rounded-[6px] z-10 flex items-center justify-center">
            <img src={PlusIcon} alt="Create" className="w-[18px] h-[18px]" />
          </div>
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center cursor-pointer gap-[3px] text-[#999]">
        <div className="relative">
          <img src={InboxOutline} alt="Inbox" className="w-[26px] h-[26px] opacity-50" />
          <div className="absolute -top-0.5 -right-0.5 bg-[#FE2C55] text-white text-[9px] font-bold px-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full border border-black">5</div>
        </div>
        <span className="text-[9px] font-semibold tracking-wide">Inbox</span>
      </div>
      <NavButton outlineIcon={ProfileOutline} filledIcon={ProfileFilled} label="Profile" />
    </div>
  </nav>
);

export const YouTubePlayer = ({
  youtubeId,
  isMuted,
  registerPlayer,
  onPlaybackReadyChange,
}: {
  youtubeId: string;
  isMuted: boolean;
  registerPlayer: RegisterPlayer;
  onPlaybackReadyChange?: PlaybackReadyChange;
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);
  const [playerState, setPlayerState] = useState<number | null>(null);
  const [playerError, setPlayerError] = useState<number | null>(null);
  const initialVideoIdRef = useRef(youtubeId);
  const currentVideoIdRef = useRef(youtubeId);
  const audioAppliedToVideoRef = useRef<string | null>(null);
  const lastCommandTimeRef = useRef(0);
  const commandTimersRef = useRef(new Set<ReturnType<typeof setTimeout>>());

  const sendCommand = useCallback((command: Parameters<typeof sendYouTubeCommand>[1], args: unknown[] = []) => {
    const delay = Math.max(0, 50 - (Date.now() - lastCommandTimeRef.current));
    const timer = setTimeout(() => {
      commandTimersRef.current.delete(timer);
      const playerWindow = iframeRef.current?.contentWindow;
      if (!playerWindow) return;
      sendYouTubeCommand(playerWindow, command, args);
      lastCommandTimeRef.current = Date.now();
    }, delay);
    commandTimersRef.current.add(timer);
  }, []);

  const applyAudioState = useCallback((nextMuted: boolean) => {
    const playerWindow = iframeRef.current?.contentWindow;
    if (!playerWindow || !isApiReady || playerError !== null) return false;

    syncYouTubePlayback(playerWindow, { isMuted: nextMuted, shouldPlay: !nextMuted });
    if (nextMuted) audioAppliedToVideoRef.current = null;
    return true;
  }, [isApiReady, playerError]);

  useEffect(() => {
    return registerPlayer(applyAudioState);
  }, [applyAudioState, registerPlayer]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
      if (event.origin !== "https://www.youtube.com") return;

      try {
        const update = parseYouTubePlayerMessage(event.data);
        if (!update) return;

        setIsApiReady(true);
        if (update.type === "state") {
          setPlayerState(update.state);
          if (update.state === 1) setIsVideoReady(true);
        } else if (update.type === "error") {
          setPlayerError(update.code);
          setPlayerState(null);
          setIsVideoReady(false);
        }
      } catch {
        // Ignore non-JSON messages from the player.
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
      for (const timer of commandTimersRef.current) clearTimeout(timer);
      commandTimersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!isApiReady) return;
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "listening" }),
      "https://www.youtube.com",
    );
  }, [isApiReady]);

  useEffect(() => {
    if (!isApiReady || currentVideoIdRef.current === youtubeId) return;
    currentVideoIdRef.current = youtubeId;
    audioAppliedToVideoRef.current = null;
    setPlayerState(null);
    setPlayerError(null);
    setIsVideoReady(false);
    sendCommand("loadVideoById", [youtubeId]);
  }, [isApiReady, sendCommand, youtubeId]);

  useEffect(() => {
    if (!shouldRetryYouTubePlayback({ isApiReady, playerState, playerError })) return;
    const timer = setTimeout(() => sendCommand("playVideo"), 800);
    return () => clearTimeout(timer);
  }, [isApiReady, playerError, playerState, sendCommand]);

  useEffect(() => {
    if (!isApiReady || playerError !== null) return;

    if (isMuted) {
      sendCommand("mute");
      audioAppliedToVideoRef.current = null;
    } else if (playerState === 1 && audioAppliedToVideoRef.current !== youtubeId) {
      sendCommand("unMute");
      sendCommand("setVolume", [100]);
      audioAppliedToVideoRef.current = youtubeId;
    }
  }, [isApiReady, isMuted, playerError, playerState, sendCommand, youtubeId]);

  const isCurrentVideoReady = isVideoReady && currentVideoIdRef.current === youtubeId;
  const isCurrentVideoFailed = playerError !== null && currentVideoIdRef.current === youtubeId;

  useEffect(() => {
    onPlaybackReadyChange?.(youtubeId, isCurrentVideoReady);
  }, [isCurrentVideoReady, onPlaybackReadyChange, youtubeId]);

  return (
    <div
      data-testid="youtube-player"
      data-youtube-id={youtubeId}
      data-loaded-youtube-id={currentVideoIdRef.current}
      data-player-state={playerState ?? ""}
      data-player-error={playerError ?? ""}
      className="youtube-player-wrapper w-full h-full relative overflow-hidden bg-black"
    >
      <iframe
        ref={iframeRef}
        onLoad={() => {
          setIsApiReady(true);
        }}
        src={getYouTubeEmbedUrl(initialVideoIdRef.current)}
        className={`w-full h-full object-cover transition-opacity duration-300 ease-in-out scale-125 origin-center pointer-events-none ${isCurrentVideoReady ? 'opacity-100' : 'opacity-0'}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
      <div className={`absolute inset-0 bg-black transition-opacity duration-300 ease-in-out pointer-events-none ${isCurrentVideoReady ? 'opacity-0' : 'opacity-100'}`}>
        <img
          src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
          alt="Cover"
          className="w-full h-full object-cover scale-125 origin-center"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
          }}
        />
        {!isCurrentVideoReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            {isCurrentVideoFailed ? (
              <output className="block rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white">
                Video unavailable — swipe to continue
              </output>
            ) : (
              <div data-testid="youtube-loading-spinner" className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const VideoInfo = ({ item }: { item: VideoItem }) => (
  <div className="flex-1 flex flex-col justify-end pl-2 pb-1 max-w-[calc(100%-60px)] z-10 text-left drop-shadow-md">
    <h3 className="font-bold text-[15px] mb-1">{item.username}</h3>
    <p className="text-[13px] mb-1.5 leading-[1.2] font-normal opacity-90">{item.description}</p>
    <div className="flex items-center gap-2 text-[12px]">
      <img src={MusicIcon} alt="Music" className="w-[12px] h-[12px]" />
      <div className="w-[140px] overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <span className="inline-block text-[12px] font-medium animate-marquee pl-2">{item.music}</span>
      </div>
    </div>
  </div>
);

const VideoSidebar = ({ item }: { item: VideoItem }) => (
  <div className="flex flex-col items-center pr-2 w-[45px] z-10 pb-0">
    <div className="relative mb-[20px]">
      <div className="w-10 h-10 rounded-full bg-gray-200 border border-white bg-cover shadow-md" style={{ backgroundImage: "url('https://api.dicebear.com/9.x/avataaars/svg?seed=Felix')" }} />
      <div className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-5 h-5 bg-[#fe2c55] rounded-full flex items-center justify-center text-white text-[12px] font-bold">+</div>
    </div>
    <ActionButton icon={HeartIcon} label={item.likes} />
    <ActionButton icon={CommentIcon} label={item.comments} />
    <ActionButton icon={BookmarkIcon} label="Favorites" />
    <ActionButton icon={ShareIcon} label={item.shares} />
    <div className="w-10 h-10 bg-[#222] rounded-full flex items-center justify-center border-[8px] border-[#161616] bg-gradient-to-b from-[#111] to-[#333] animate-[spin_6s_linear_infinite] mt-2 mb-0 relative overflow-hidden shadow-md">
      <div className="absolute w-[18px] h-[18px] bg-cover rounded-full" style={{ backgroundImage: "url('https://api.dicebear.com/9.x/avataaars/svg?seed=Felix')" }} />
    </div>
  </div>
);

export const VideoCard = ({ item, isPlayerReady }: { item: VideoItem; isPlayerReady: boolean }) => (
  <div data-testid={`video-card-${item.id}`} className="w-full h-full relative overflow-hidden">
    <div data-testid={`video-poster-${item.id}`} className={`absolute inset-0 bg-black pointer-events-none transition-opacity duration-300 ease-in-out ${isPlayerReady ? 'opacity-0' : 'opacity-100'}`}>
      <img
        src={`https://img.youtube.com/vi/${item.youtubeId}/maxresdefault.jpg`}
        alt={`Preview for ${item.description}`}
        className="w-full h-full object-cover scale-125 origin-center"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`;
        }}
      />
    </div>
    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 20%, transparent 70%, rgba(0,0,0,0.8) 100%)' }} />
    <div className="absolute inset-0 flex flex-col justify-end pb-[48px] pointer-events-none">
      <div className="flex justify-between w-full pointer-events-auto items-end pb-2">
        <VideoInfo item={item} />
        <VideoSidebar item={item} />
      </div>
    </div>
  </div>
);

export function App() {
  const [isMuted, setIsMuted] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playingIndex, setPlayingIndex] = useState(0);
  const [readyVideoId, setReadyVideoId] = useState<string | null>(null);
  const playerControllerRef = useRef<PlayerAudioController | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const registerPlayer = useCallback<RegisterPlayer>((controller) => {
    playerControllerRef.current = controller;

    return () => {
      if (playerControllerRef.current === controller) playerControllerRef.current = null;
    };
  }, []);

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    const didApply = playerControllerRef.current?.(nextMuted);
    if (!didApply) return;
    setIsMuted(nextMuted);
  }, [isMuted]);

  const handleIndexChange = useCallback((nextIndex: number, _source: IndexChangeSource) => {
    setActiveIndex(nextIndex);
  }, []);

  const handlePlaybackReadyChange = useCallback<PlaybackReadyChange>((youtubeId, isReady) => {
    setReadyVideoId((current) => {
      if (isReady) return youtubeId;
      return current === youtubeId ? null : current;
    });
  }, []);

  const handleMotionChange = useCallback((motion: SwipeDeckMotion) => {
    setPlayingIndex((current) => current === motion.index ? current : motion.index);
    if (playerContainerRef.current) {
      playerContainerRef.current.style.transform = `translate3d(0, ${motion.offset}px, 0)`;
    }
  }, []);

  return (
    <div className="w-full h-full bg-black flex justify-center">
      {/* Constrain to mobile-like width on desktop */}
      <main className="w-full max-w-[430px] h-full relative text-white bg-black">
        <div data-testid="shared-youtube-player" ref={playerContainerRef} className="absolute inset-0 z-0 will-change-transform">
          <YouTubePlayer
            youtubeId={items[playingIndex].youtubeId}
            isMuted={isMuted}
            registerPlayer={registerPlayer}
            onPlaybackReadyChange={handlePlaybackReadyChange}
          />
        </div>
        <MuteButton isMuted={isMuted} toggleMute={toggleMute} />
        <Header />
        <div className="w-full h-full">
          <SwipeDeck
            items={items}
            index={activeIndex}
            onIndexChange={handleIndexChange}
            onMotionChange={handleMotionChange}
            className="w-full h-full overflow-y-auto overflow-x-hidden relative scrollbar-none"
            gesture={{ ignoreWhileAnimating: false }}
            keyboard={{ global: true }}
            virtual={{ overscan: 5 }}
            preload={2} // Preload the next 2 videos
            preloadPrevious={1} // Keep the previous video preloaded
          >
            {({ item, index }) => (
              <VideoCard
                item={item}
                isPlayerReady={index === playingIndex && readyVideoId === item.youtubeId}
              />
            )}
          </SwipeDeck>
        </div>
        <BottomNav />
      </main>
    </div>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) createRoot(rootEl).render(<App />);
