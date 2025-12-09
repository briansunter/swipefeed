import { createRoot } from "react-dom/client";
import { useState, useEffect, useRef } from "react";
import { SwipeDeck } from "../src";
import "./index.css";

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

const COLOR_PALETTE = ["#4CAF50", "#FF9800", "#E91E63", "#9C27B0", "#2196F3"];

const YOUTUBE_IDS = [
  "x2BwY40EYp8",
  "tUiFUJFQZKo",
  "gcPJH-qQ7To",
  "qK38nPgaQ2U",
  "TcIjPPrwX4U",
  "LCqBUv5TJ0U",
  "6Wk_rydOz6Y",
  "Wi_f2dR9Frg",
  "EEGJMnqHT7Q",
  "jUvgToe3pNE",
  "xKEn892Xhjs",
  "HeuQ_gvg0f8",
  "k70PAc_qsi8",
  "B9vlupuRjX4",
  "RNJhm72AEnI",
  "ga66siYwX7U",
  "Jb3XHHcmFlw",
  "6jCmv1sACVU",
  "HpaNtWOLfpA",
  "1ZngUyLPT0A",
  "UzxZ2oVLVrY",
  "mkfSZDwAaf8",
  "FiYWmBdBhxs",
  "ZHk8w8fCy2I",
  "mkfSZDwAaf8",
  "GDcdFtZExzM",
  "dDHPkaJXHQg",
];

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

const YouTubePlayer = ({ youtubeId, isActive, isMuted, shouldPreload }: { youtubeId: string; isActive: boolean; isMuted: boolean; shouldPreload?: boolean }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const shouldRender = isActive || shouldPreload;

  // Reset video ready state when becoming inactive (and not preloading)
  useEffect(() => {
    if (!shouldRender) {
      setIsVideoReady(false);
    }
  }, [shouldRender]);

  // Listen for YouTube API messages
  useEffect(() => {
    if (!shouldRender) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube.com") return;
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (data.event === "onReady" || data.event === "onStateChange" || (data.event === "infoDelivery" && data.info)) {
          setIsVideoReady(true);
        }

        // Auto-pause if preloading and video starts playing
        if (data.event === "onStateChange" && data.info === 1) { // 1 = Playing
          if (shouldPreload && !isActive) {
            iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }), "*");
          }
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [shouldRender, shouldPreload, isActive]);

  // Fallback: show video after timeout if no API message received
  useEffect(() => {
    if (!shouldRender) return;
    const timeout = setTimeout(() => setIsVideoReady(true), 2000);
    return () => clearTimeout(timeout);
  }, [shouldRender]);

  // Control mute/play state
  useEffect(() => {
    if (!iframeRef.current || !isVideoReady) return;

    if (isActive) {
      // Setup for active viewing
      const muteAction = isMuted ? "mute" : "unMute";
      iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: "command", func: muteAction, args: [] }), "*");
      iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
    } else if (shouldPreload) {
      // Setup for preloading (muted)
      iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "mute", args: [] }), "*");
      // We rely on autoplay=1 to start, then the message listener pauses it
    }
  }, [isMuted, isVideoReady, isActive, shouldPreload]);

  return (
    <div className="youtube-player-wrapper w-full h-full relative overflow-hidden bg-black">
      {/* Render iframe if active OR preloading */}
      {shouldRender && (
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&showinfo=0&loop=1&playlist=${youtubeId}&playsinline=1&origin=${encodeURIComponent(window.location.origin)}`}
          // Keep opacity 0 if not active (so preloader is hidden)
          className={`w-full h-full object-cover transition-opacity duration-500 ease-in scale-125 origin-center pointer-events-none ${(isVideoReady && isActive) ? 'opacity-100' : 'opacity-0'}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      )}
      {/* Thumbnail - hide when Active AND Ready */}
      <div className={`absolute inset-0 bg-black transition-opacity duration-500 ease-out pointer-events-none ${(isActive && isVideoReady) ? 'opacity-0' : 'opacity-100'}`}>
        <img
          src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
          alt="Cover"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
          }}
        />
        {/* Only show spinner when active and loading (not when preloading) */}
        {isActive && !isVideoReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
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

const VideoCard = ({ item, isActive, isMuted, shouldPreload }: { item: VideoItem; isActive: boolean; isMuted: boolean; shouldPreload?: boolean }) => (
  <div className="w-full h-full relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${item.color} 0%, #000 120%)` }}>
    <YouTubePlayer youtubeId={item.youtubeId} isActive={isActive} isMuted={isMuted} shouldPreload={shouldPreload} />
    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 20%, transparent 70%, rgba(0,0,0,0.8) 100%)' }} />
    <div className="absolute inset-0 flex flex-col justify-end pb-[48px] pointer-events-none">
      <div className="flex justify-between w-full pointer-events-auto items-end pb-2">
        <VideoInfo item={item} />
        <VideoSidebar item={item} />
      </div>
    </div>
  </div>
);

function App() {
  const [isMuted, setIsMuted] = useState(true);

  return (
    <div className="w-full h-full bg-black flex justify-center">
      {/* Constrain to mobile-like width on desktop */}
      <main className="w-full max-w-[430px] h-full relative text-white bg-black">
        <MuteButton isMuted={isMuted} toggleMute={() => setIsMuted(!isMuted)} />
        <Header />
        <div className="w-full h-full">
          <SwipeDeck
            items={items}
            className="w-full h-full overflow-y-auto overflow-x-hidden relative scrollbar-none"
            gesture={{ ignoreWhileAnimating: false }}
            keyboard={{ global: true }}
            virtual={{ overscan: 5 }}
            preload={2} // Preload the next 2 videos
            preloadPrevious={1} // Keep the previous video preloaded
          >
            {({ item, isActive, shouldPreload }) => <VideoCard item={item} isActive={isActive} isMuted={isMuted} shouldPreload={shouldPreload} />}
          </SwipeDeck>
        </div>
        <BottomNav />
      </main>
    </div>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) createRoot(rootEl).render(<App />);
