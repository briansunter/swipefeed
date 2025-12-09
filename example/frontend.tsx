import { createRoot } from "react-dom/client";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { SwipeDeck, useSwipeDeck, useWindowSize } from "../src";
import "./index.css";

// --- Types ---
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

// --- YouTube Shorts Data ---
const REAL_SHORTS = [
  { youtubeId: "9R5lKECPTSE", username: "@user_1", description: "Viral Short #1", music: "Sound 1", color: "#4CAF50" },
  { youtubeId: "5xkpJkaxT9A", username: "@user_2", description: "Viral Short #2", music: "Sound 2", color: "#FF9800" },
  { youtubeId: "fysFPjbLzlY", username: "@user_3", description: "Viral Short #3", music: "Sound 3", color: "#E91E63" },
  { youtubeId: "RSjq1YtYarY", username: "@user_4", description: "Viral Short #4", music: "Sound 4", color: "#9C27B0" },
  { youtubeId: "iQaymOlRQxM", username: "@user_5", description: "Viral Short #5", music: "Sound 5", color: "#2196F3" },
];

const generateVideos = (count: number): VideoItem[] => {
  return Array.from({ length: count }, (_, i) => {
    const template = REAL_SHORTS[i % REAL_SHORTS.length];
    return {
      id: `video-${i}`,
      youtubeId: template.youtubeId,
      username: template.username,
      description: `TikTok clone item #${i + 1}: ${template.description}`,
      music: template.music,
      likes: `${(Math.random() * 500).toFixed(1)}K`,
      comments: `${Math.floor(Math.random() * 1000)}`,
      shares: `${Math.floor(Math.random() * 500)}`,
      color: template.color,
    };
  });
};

const DATA_SET = generateVideos(20);

// --- Icons (Inline SVGs) ---
const HeartIcon = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" fill="white" filter="drop-shadow(0px 1px 3px rgba(0,0,0,0.3))">
    <path d="M24 41.95L21.05 39.2C10.55 29.7 3.65 23.45 3.65 15.75C3.65 9.45 8.6 4.45 14.9 4.45C18.45 4.45 21.85 6.1 24 8.6C26.15 6.1 29.55 4.45 33.1 4.45C39.4 4.45 44.35 9.45 44.35 15.75C44.35 23.45 37.45 29.7 26.95 39.2L24 41.95Z" fill="#fff" />
  </svg>
);

const CommentIcon = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" fill="white" filter="drop-shadow(0px 1px 3px rgba(0,0,0,0.3))">
    <path d="M40.6 12.15C40.6 7.9 36.95 4.45 32.5 4.45H15.5C11.05 4.45 7.4 7.9 7.4 12.15V32.95C7.4 35.05 9.15 36.75 11.3 36.75H15.5V43.55L24.8 36.75H32.5C36.95 36.75 40.6 33.3 40.6 29.05V12.15ZM13 18.5H35V21.5H13V18.5ZM13 24.5H28V27.5H13V24.5Z" fill="#fff" />
    <circle cx="15" cy="20" r="2.5" fill="#161823" />
    <circle cx="24" cy="20" r="2.5" fill="#161823" />
    <circle cx="33" cy="20" r="2.5" fill="#161823" />
  </svg>
);

const BookmarkIcon = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" fill="white" filter="drop-shadow(0px 1px 3px rgba(0,0,0,0.3))">
    <path d="M38 42L24 34L10 42V8C10 5.8 11.8 4 14 4H34C36.2 4 38 5.8 38 8V42Z" fill="#fff" />
  </svg>
);

const ShareIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="white" filter="drop-shadow(0px 1px 3px rgba(0,0,0,0.3))">
    <path d="M37.3 18.55V8.85L47.4 20.95L37.3 33.05V23.75C24.1 23.75 14.9 28 8.6 37.05C9.7 26.65 19.3 18.85 37.3 18.55Z" fill="#fff" />
  </svg>
);

const MusicIcon = () => (
  <svg width="15" height="15" viewBox="0 0 48 48" fill="white" >
    <path d="M24 6V30.9C23.1 30.35 21.95 30 20.7 30C16.85 30 13.7 33.15 13.7 37C13.7 40.85 16.85 44 20.7 44C24.55 44 27.7 40.85 27.7 37V16H38V6H24Z" fill="white" />
  </svg>
);

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="32" height="32" viewBox="0 0 48 48" fill={active ? "white" : "white"} style={{ opacity: active ? 1 : 0.5 }}>
    <path d="M39.5 25.5V42H28.5V30H19.5V42H8.5V25.5L24 11.5L39.5 25.5Z" fill="currentColor" />
    <path d="M24 6L6 22H9V43H18V31H30V43H39V22H42L24 6Z" fill={active ? "white" : "transparent"} stroke={active ? "none" : "white"} strokeWidth="4" />
  </svg>
);

const FriendsIcon = ({ active }: { active: boolean }) => (
  <svg width="32" height="32" viewBox="0 0 48 48" fill={active ? "white" : "white"} style={{ opacity: active ? 1 : 0.5 }}>
    <path d="M14 26C18.4183 26 22 22.4183 22 18C22 13.5817 18.4183 10 14 10C9.58172 10 6 13.5817 6 18C6 22.4183 9.58172 26 14 26Z" stroke="currentColor" strokeWidth="4" fill={active ? "currentColor" : "none"} />
    <path d="M34 26C38.4183 26 42 22.4183 42 18C42 13.5817 38.4183 10 34 10C29.5817 10 26 13.5817 26 18C26 22.4183 29.5817 26 34 26Z" stroke="currentColor" strokeWidth="4" fill={active ? "currentColor" : "none"} />
    <path d="M7 36C7 32.134 10.134 29 14 29H15" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M33 29H34C37.866 29 41 32.134 41 36" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M24 38C24 34.134 20.866 31 17 31H16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M32 31H31C27.134 31 24 34.134 24 38" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const InboxIcon = ({ active }: { active: boolean }) => (
  <svg width="32" height="32" viewBox="0 0 48 48" fill={active ? "white" : "white"} style={{ opacity: active ? 1 : 0.5 }}>
    <path d="M9 14.5C9 11.4624 11.4624 9 14.5 9H33.5C36.5376 9 39 11.4624 39 14.5V31.5C39 34.5376 36.5376 37 33.5 37H24L17 41V37H14.5C11.4624 37 9 34.5376 9 31.5V14.5Z" stroke="currentColor" strokeWidth="4" fill={active ? "currentColor" : "none"} />
    <path d="M17 23H31" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="32" height="32" viewBox="0 0 48 48" fill={active ? "white" : "white"} style={{ opacity: active ? 1 : 0.5 }}>
    <circle cx="24" cy="15" r="7" stroke="currentColor" strokeWidth="4" fill={active ? "currentColor" : "none"} />
    <path d="M10.8706 36.562C12.3082 31.2599 17.7291 27 24 27C30.2709 27 35.6918 31.2599 37.1294 36.562C37.7562 38.8732 36.0076 41 33.6111 41H14.3889C11.9924 41 10.2438 38.8732 10.8706 36.562Z" stroke="currentColor" strokeWidth="4" fill={active ? "currentColor" : "none"} />
  </svg>
);

// --- Components ---

const ActionButton = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) => (
  <button className="flex flex-col items-center bg-transparent border-none cursor-pointer p-0 mb-3.5 transition-opacity duration-200 active:opacity-70 active:scale-95" onClick={onClick}>
    <div className="w-10 h-10 flex items-center justify-center mb-0.5">
      {icon}
    </div>
    <span className="text-white text-[11px] font-semibold drop-shadow-md tracking-wide text-center">{label}</span>
  </button>
);

// --- Mute Button Component ---
const MuteButton = ({ isMuted, toggleMute }: { isMuted: boolean; toggleMute: () => void }) => (
  <button
    onClick={(e) => { e.stopPropagation(); toggleMute(); }}
    className="fixed left-4 top-4 z-[9999] w-8 h-8 bg-black/35 rounded-full backdrop-blur-sm border border-white/20 flex items-center justify-center cursor-pointer pointer-events-auto"
  >
    {isMuted ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
    ) : (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
    )}
  </button>
);

const YouTubePlayer = ({ youtubeId, isActive, isMuted }: { youtubeId: string; isActive: boolean; isMuted: boolean }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);

  // Sync Playback State
  useEffect(() => {
    if (!iframeRef.current || !isReady) return;
    const action = isActive ? "playVideo" : "pauseVideo";
    iframeRef.current.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: action, args: [] }),
      "*"
    );
  }, [isActive, isReady]);

  // Sync Mute State
  useEffect(() => {
    if (!iframeRef.current || !isReady) return;
    const action = isMuted ? "mute" : "unMute";
    iframeRef.current.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: action, args: [] }),
      "*"
    );
  }, [isMuted, isReady]);

  // Stable URL: set mute=1 initially to handle autoplay policies.
  const embedUrl = `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&showinfo=0&loop=1&playlist=${youtubeId}&playsinline=1`;
  const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

  return (
    <div className="youtube-player-wrapper w-full h-full relative overflow-hidden bg-black">
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-full object-cover"
        style={{
          pointerEvents: 'none',
          opacity: 1, // Always show iframe
          transition: 'opacity 0.4s ease-in',
          transform: 'scale(1.35)',
          transformOrigin: 'center center'
        }}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        onLoad={() => setIsReady(true)}
      />

      {/* Placeholder / Cover */}
      <div
        className="absolute inset-0 bg-black"
        style={{
          opacity: isReady ? 0 : 1,
          transition: 'opacity 0.4s ease-out',
          pointerEvents: 'none',
          zIndex: 1
        }}
      >
        <img
          src={thumbnailUrl}
          alt="Cover"
          className="w-full h-full object-cover opacity-80"
        />
      </div>
    </div>
  );
};

const VideoOverlay = ({ item }: { item: VideoItem }) => {
  return (
    <div className="absolute inset-0 flex flex-col justify-end pb-[54px] pointer-events-none">
      <div className="flex justify-between w-full pointer-events-auto items-end pb-4">
        <div className="flex-1 flex flex-col justify-end pl-3 pb-0 max-w-[calc(100%-70px)] z-10 text-left drop-shadow-md">
          <h3 className="font-bold text-[17px] mb-1">{item.username}</h3>
          <p className="text-[15px] mb-1.5 leading-[1.3] font-normal">{item.description}</p>
          <div className="flex items-center gap-2.5 text-[13px]">
            <MusicIcon />
            <div className="w-[150px] overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
              <span className="inline-block text-[13px] font-medium animate-marquee pl-2.5">
                {item.music}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center pr-3 w-[50px] z-10 pb-2">
          <div className="relative mb-[26px]">
            <div className="w-12 h-12 rounded-full bg-gray-200 border border-white bg-cover shadow-md" style={{ backgroundImage: "url('https://api.dicebear.com/9.x/avataaars/svg?seed=Felix')" }}></div>
            <div className="absolute -bottom-[11px] left-1/2 -translate-x-1/2 w-6 h-6 bg-[#fe2c55] rounded-full flex items-center justify-center text-white text-[14px] font-bold">+</div>
          </div>
          <ActionButton icon={<HeartIcon />} label={item.likes} />
          <ActionButton icon={<CommentIcon />} label={item.comments} />
          <ActionButton icon={<BookmarkIcon />} label="Favorites" />
          <ActionButton icon={<ShareIcon />} label={item.shares} />
          <div className="w-12 h-12 bg-[#222] rounded-full flex items-center justify-center border-[9px] border-[#161616] bg-gradient-to-b from-[#111] to-[#333] animate-spin mt-2.5 mb-0 relative overflow-hidden shadow-md">
            <div className="absolute w-[22px] h-[22px] bg-cover rounded-full" style={{ backgroundImage: "url('https://api.dicebear.com/9.x/avataaars/svg?seed=Felix')" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const VideoCard = ({ item, isActive, isMuted }: { item: VideoItem; isActive: boolean; isMuted: boolean }) => {
  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${item.color} 0%, #000 120%)`,
      }}
    >
      <YouTubePlayer youtubeId={item.youtubeId} isActive={isActive} isMuted={isMuted} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 20%, transparent 70%, rgba(0,0,0,0.8) 100%)' }} />
      <VideoOverlay item={item} />
    </div>
  );
};

// --- Feeds ---

function SwipeFeed({ items, isMuted }: { items: VideoItem[]; isMuted: boolean }) {
  const { height } = useWindowSize();
  const itemHeight = height > 0 ? height : 800;

  return (
    <SwipeDeck
      items={items}
      className="w-full h-full overflow-hidden relative"
      orientation="vertical"
      loop={false}
      virtual={{
        estimatedSize: itemHeight,
      }}
      wheel={{ discretePaging: true }}
      gesture={{
        lockAxis: true,
        ignoreWhileAnimating: false,
        threshold: 10,
      }}
    >
      {({ item, isActive }) => (
        <VideoCard item={item} isActive={isActive} isMuted={isMuted} />
      )}
    </SwipeDeck>
  );
}

// --- App ---

function App() {
  const items = DATA_SET;
  const [isMuted, setIsMuted] = useState(true);

  return (
    <main className="w-full h-full relative text-white bg-black">

      {/* Global Mute Button */}
      <MuteButton isMuted={isMuted} toggleMute={() => setIsMuted(!isMuted)} />

      {/* Header */}
      <header className="absolute top-0 w-full flex justify-center items-center z-50 pt-2.5 pointer-events-none">
        <div className="pointer-events-auto flex items-baseline text-white">
          <span className="text-[17px] font-semibold drop-shadow-md opacity-70">
            Following
          </span>
          <span className="opacity-30 mx-3 text-[14px]">|</span>
          <span className="text-[18px] font-bold drop-shadow-md border-b-[3px] border-white pb-1.5 -mb-1.5">
            For You
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="w-full h-full">
        <SwipeFeed items={items} isMuted={isMuted} />
      </div>

      {/* Bottom Nav */}
      <nav className="absolute h-[54px] bottom-0 w-full bg-black border-t border-white/15 flex justify-around items-center z-50 pb-[env(safe-area-inset-bottom,20px)]">
        <button className="flex flex-col items-center justify-center bg-transparent border-none text-white cursor-pointer gap-[3px] w-[20%]">
          <HomeIcon active={true} />
          <span className="text-[10px] font-semibold tracking-wide">Home</span>
        </button>
        <button className="flex flex-col items-center justify-center bg-transparent border-none text-[#999] cursor-pointer gap-[3px] w-[20%]">
          <FriendsIcon active={false} />
          <span className="text-[10px] font-semibold tracking-wide">Friends</span>
        </button>
        <div className="flex items-center justify-center w-[20%]">
          <button className="w-[44px] h-[30px] relative bg-white rounded-lg flex items-center justify-center transition-transform active:scale-90 before:absolute before:-left-1 before:w-[44px] before:h-[30px] before:bg-[#25F4EE] before:rounded-lg before:-z-10 after:absolute after:-right-1 after:w-[44px] after:h-[30px] after:bg-[#FE2C55] after:rounded-lg after:-z-20">
            <span className="text-[#121212] text-[20px] font-extrabold leading-none mt-px">+</span>
          </button>
        </div>
        <button className="flex flex-col items-center justify-center bg-transparent border-none text-[#999] cursor-pointer gap-[3px] w-[20%]">
          <InboxIcon active={false} />
          <span className="text-[10px] font-semibold tracking-wide">Inbox</span>
        </button>
        <button className="flex flex-col items-center justify-center bg-transparent border-none text-[#999] cursor-pointer gap-[3px] w-[20%]">
          <ProfileIcon active={false} />
          <span className="text-[10px] font-semibold tracking-wide">Profile</span>
        </button>
      </nav>
    </main>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
