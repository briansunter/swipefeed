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
  <svg width="36" height="36" viewBox="0 0 48 48" fill="white" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.5))">
    <path d="M24 41.95L21.05 39.2C10.55 29.7 3.65 23.45 3.65 15.75C3.65 9.45 8.6 4.45 14.9 4.45C18.45 4.45 21.85 6.1 24 8.6C26.15 6.1 29.55 4.45 33.1 4.45C39.4 4.45 44.35 9.45 44.35 15.75C44.35 23.45 37.45 29.7 26.95 39.2L24 41.95Z" fill="#fff" />
  </svg>
);

const CommentIcon = () => (
  <svg width="34" height="34" viewBox="0 0 48 48" fill="white" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.5))">
    <path d="M40.6 12.15C40.6 7.9 36.95 4.45 32.5 4.45H15.5C11.05 4.45 7.4 7.9 7.4 12.15V32.95C7.4 35.05 9.15 36.75 11.3 36.75H15.5V43.55L24.8 36.75H32.5C36.95 36.75 40.6 33.3 40.6 29.05V12.15Z" fill="#fff" />
  </svg>
);

const BookmarkIcon = () => (
  <svg width="34" height="34" viewBox="0 0 48 48" fill="white" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.5))">
    <path d="M38 42L24 34L10 42V8C10 5.8 11.8 4 14 4H34C36.2 4 38 5.8 38 8V42Z" fill="#fff" />
  </svg>
);

const ShareIcon = () => (
  <svg width="34" height="34" viewBox="0 0 48 48" fill="white" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.5))">
    <path d="M37.3 18.55V8.85L47.4 20.95L37.3 33.05V23.75C24.1 23.75 14.9 28 8.6 37.05C9.7 26.65 19.3 18.85 37.3 18.55Z" fill="#fff" />
  </svg>
);

const MusicIcon = () => (
  <svg width="15" height="15" viewBox="0 0 48 48" fill="white" >
    <path d="M24 6V30.9C23.1 30.35 21.95 30 20.7 30C16.85 30 13.7 33.15 13.7 37C13.7 40.85 16.85 44 20.7 44C24.55 44 27.7 40.85 27.7 37V16H38V6H24Z" fill="white" />
  </svg>
);

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 48 48" fill={active ? "white" : "#888"}>
    <path d="M24 4L6 18V42H18V28H30V42H42V18L24 4Z" fill="currentColor" />
  </svg>
);

const FriendsIcon = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 48 48" fill={active ? "white" : "#888"}>
    <path d="M32 24C36.4183 24 40 20.4183 40 16C40 11.5817 36.4183 8 32 8C27.5817 8 24 11.5817 24 16C24 20.4183 27.5817 24 32 24ZM16 28C20.4183 28 24 24.4183 24 20C24 15.5817 20.4183 12 16 12C11.5817 12 8 15.5817 8 20C8 24.4183 11.5817 28 16 28ZM8 34V38H24V34C24 31.79 22.21 30 20 30H12C9.79 30 8 31.79 8 34ZM28 30H36C38.21 30 40 31.79 40 34V38H48V34C48 30.69 45.31 28 42 28H32.6C30.6 28.5 29.1 29.8 28 30Z" fill="currentColor" />
  </svg>
);

const InboxIcon = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 48 48" fill={active ? "white" : "#888"}>
    <path d="M40 8H8C5.8 8 4 9.8 4 12V36C4 38.2 5.8 40 8 40H40C42.2 40 44 38.2 44 36V12C44 9.8 42.2 8 40 8ZM40 12V20H32C32 24.42 28.42 28 24 28C19.58 28 16 24.42 16 20H8V12H40Z" fill="currentColor" />
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 48 48" fill={active ? "white" : "#888"}>
    <path d="M24 24C29.5228 24 34 19.5228 34 14C34 8.47715 29.5228 4 24 4C18.4772 4 14 8.47715 14 14C14 19.5228 18.4772 24 24 24ZM24 28C17.3333 28 4 31.3333 4 38V44H44V38C44 31.3333 30.6667 28 24 28Z" fill="currentColor" />
  </svg>
);

// --- Components ---

const ActionButton = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) => (
  <button className="action-button" onClick={onClick}>
    <div className="action-icon-circle">
      {icon}
    </div>
    <span className="action-label">{label}</span>
  </button>
);

const YouTubePlayer = ({ youtubeId, isActive }: { youtubeId: string; isActive: boolean }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

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

  const toggleMute = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  // Stable URL: Removed 'isActive' from dependency.
  // CRITICAL: Set autoplay=1 to force player initialization and loading of the "Real" video frame.
  // We rely on the useEffect(isActive) to immediately send 'pauseVideo' for off-screen items.
  // This ensures the video is buffered/ready and showing video content, not just a thumbnail.
  const embedUrl = `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&showinfo=0&loop=1&playlist=${youtubeId}&playsinline=1`;
  const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

  return (
    <div className="youtube-player-wrapper w-full h-full relative overflow-hidden bg-black">
      {/* 
         Scale 1.35x to push standard YouTube top-bar/title out of visible area.
         Pointer-events: none ensures swipes go through to the SwipeDeck container.
      */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-full object-cover"
        style={{
          pointerEvents: 'none',
          opacity: 1, // Always show iframe, just control playback
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

      {/* Custom Volume Control - Integrated into side actions via absolute positioning matching sidebar */}
      {isActive && (
        <div className="absolute right-2 bottom-40 z-50 flex flex-col items-center" style={{ bottom: '380px', right: '8px' }}>
          {/* Position roughly above the first sidebar item or integrated. 
                 The Sidebar is in VideoOverlay. 
                 To align perfectly, we'd ideally move this to VideoOverlay, but state is here.
                 Visual approximation: Sidebar is bottom-aligned. 
                 We'll place this nicely on the side.
            */}
          <button
            onClick={toggleMute}
            className="flex flex-col items-center justify-center mb-4"
            style={{ pointerEvents: 'auto', width: '40px', height: '40px', background: 'rgba(0,0,0,0.4)', borderRadius: '50%' }}
          >
            {isMuted ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
            )}
          </button>
          <span style={{ fontSize: '10px', textShadow: '0 1px 2px rgba(0,0,0,0.5)', marginTop: '-4px' }}>
            {isMuted ? 'Unmute' : 'Mute'}
          </span>
        </div>
      )}

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
        {/* Only show thumb if not ready, to avoid flash */}
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
    <div className="absolute inset-0 video-overlay-container pointer-events-none">
      <div className="flex justify-between w-full pointer-events-auto" style={{ alignItems: 'flex-end' }}>
        <div className="video-info">
          <h3 className="info-username">{item.username}</h3>
          <p className="info-description">{item.description}</p>
          <div className="info-music-row">
            <MusicIcon />
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', width: '150px' }}>
              <span style={{ display: 'inline-block', fontSize: '14px', fontWeight: 500, animation: 'marquee 5s linear infinite' }}>
                {item.music}
              </span>
            </div>
          </div>
        </div>

        <div className="sidebar-container" style={{ paddingBottom: '20px' }}>
          <div className="avatar-wrapper">
            <div className="avatar-circle"></div>
            <div className="avatar-plus">+</div>
          </div>
          <ActionButton icon={<HeartIcon />} label={item.likes} />
          <ActionButton icon={<CommentIcon />} label={item.comments} />
          <ActionButton icon={<BookmarkIcon />} label="Favorites" />
          <ActionButton icon={<ShareIcon />} label={item.shares} />
          <div className="disc-spin"></div>
        </div>
      </div>
    </div>
  );
};

const VideoCard = ({ item, isActive }: { item: VideoItem; isActive: boolean }) => {
  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${item.color} 0%, #000 120%)`,
      }}
    >
      <YouTubePlayer youtubeId={item.youtubeId} isActive={isActive} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.6) 100%)' }} />
      <VideoOverlay item={item} />
    </div>
  );
};

// --- Feeds ---

function SwipeFeed({ items }: { items: VideoItem[] }) {
  const { height } = useWindowSize();

  // Fallback to avoid 0 height on initial render
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
        <VideoCard item={item} isActive={isActive} />
      )}
    </SwipeDeck>
  );
}

// --- App ---

function App() {
  const items = DATA_SET;

  return (
    <main className="w-full h-full relative" style={{ color: 'white', background: 'black' }}>
      {/* Header */}
      <header className="absolute top-nav w-full flex justify-between items-start px-4" style={{ top: '24px', paddingLeft: '16px', paddingRight: '16px', zIndex: 50 }}>
        <div style={{ width: '40px' }}></div>

        <div className="nav-links flex items-center justify-center">
          <span className="nav-link-active" style={{ fontSize: '18px', fontWeight: '700', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            Following
          </span>
          <span style={{ opacity: 0.2, margin: '0 8px' }}>|</span>
          <span style={{ fontSize: '18px', fontWeight: '700', opacity: 0.6, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            For You
          </span>
        </div>

        <div style={{ width: '40px', display: 'flex', justifyContent: 'flex-end' }}></div>
      </header>

      {/* Content */}
      <div className="w-full h-full">
        <SwipeFeed items={items} />
      </div>

      {/* Bottom Nav */}
      <nav className="absolute bottom-nav w-full">
        <button className="nav-item active">
          <HomeIcon active={true} />
          <span className="nav-label">Home</span>
        </button>
        <button className="nav-item">
          <FriendsIcon active={false} />
          <span className="nav-label">Friends</span>
        </button>
        <div className="upload-wrapper">
          <button className="upload-btn">
            <span className="upload-plus">+</span>
          </button>
        </div>
        <button className="nav-item">
          <InboxIcon active={false} />
          <span className="nav-label">Inbox</span>
        </button>
        <button className="nav-item">
          <ProfileIcon active={false} />
          <span className="nav-label">Profile</span>
        </button>
      </nav>
    </main>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
