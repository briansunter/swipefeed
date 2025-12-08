import { createRoot } from "react-dom/client";
import React, { useMemo, useState, useEffect } from "react";
import { SwipeDeck, useSwipeDeck } from "../src";
import "./index.css";

// --- Types ---
type VideoItem = {
  id: string;
  username: string;
  description: string;
  music: string;
  likes: string;
  comments: string;
  shares: string;
  color: string;
};

type FeedMode = "native" | "virtualized";

// --- Mock Data ---
const generateVideos = (count: number): VideoItem[] => Array.from({ length: count }, (_, i) => ({
  id: `video-${i}`,
  username: `@user_${i + 1}`,
  description: `TikTok clone in ${count > 50 ? "Virtualized" : "Native"} mode! Item #${i + 1}`,
  music: `Original Sound - @user_${i + 1}`,
  likes: `${(Math.random() * 500).toFixed(1)}K`,
  comments: `${Math.floor(Math.random() * 1000)}`,
  shares: `${Math.floor(Math.random() * 500)}`,
  color: `hsl(${Math.random() * 360}, 70%, 60%)`,
}));

const SMALL_DATA_SET = generateVideos(20);
const LARGE_DATA_SET = generateVideos(1000);

// --- Icons (Inline SVGs) ---
const HeartIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="white" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.5))">
    <path d="M24 41.95L21.05 39.2C10.55 29.7 3.65 23.45 3.65 15.75C3.65 9.45 8.6 4.45 14.9 4.45C18.45 4.45 21.85 6.1 24 8.6C26.15 6.1 29.55 4.45 33.1 4.45C39.4 4.45 44.35 9.45 44.35 15.75C44.35 23.45 37.45 29.7 26.95 39.2L24 41.95Z" fill="#fff" />
  </svg>
); // Solid for now, typical is Outline unless liked

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

const LiveIcon = () => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
    <rect x="4" y="8" width="40" height="28" rx="2" />
    <path d="M14 41L34 41" />
    <path d="M24 36V41" />
  </svg>
);

const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
    <circle cx="20.5" cy="20.5" r="13" />
    <path d="M30 30L41 41" />
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

// --- Hooks ---
function useWindowSize() {
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

// --- Components ---

const ActionButton = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) => (
  <button className="action-button" onClick={onClick}>
    <div className="action-icon-circle">
      {icon}
    </div>
    <span className="action-label">{label}</span>
  </button>
);

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

        <div className="sidebar-container">
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
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.6) 100%)' }} />
      <VideoOverlay item={item} />
    </div>
  );
};

// --- Feeds ---

function NativeFeed({ items }: { items: VideoItem[] }) {
  const deck = useSwipeDeck({
    items,
    orientation: "vertical",
    mode: "native",
    wheel: { discretePaging: true }
  });

  return (
    <div
      {...deck.getViewportProps()}
      className="w-full h-full snap-y-mandatory overflow-y-scroll scrollbar-hide touch-pan-y"
      style={deck.getViewportProps().style}
    >
      {deck.virtualItems.map((virtualItem) => (
        <div
          key={virtualItem.key}
          {...deck.getItemProps(virtualItem.index)}
          className="w-full h-full snap-start relative"
          style={{
            ...deck.getItemProps(virtualItem.index).style,
            height: "100%", width: "100%", flexShrink: 0
          }}
        >
          <VideoCard item={items[virtualItem.index]} isActive={deck.index === virtualItem.index} />
        </div>
      ))}
    </div>
  );
}

function VirtualizedFeed({ items }: { items: VideoItem[] }) {
  const { height } = useWindowSize();

  // Fallback to avoid 0 height on initial render
  const itemHeight = height > 0 ? height : 800;

  const deck = useSwipeDeck({
    items,
    orientation: "vertical",
    mode: "virtualized",
    virtual: {
      estimatedSize: itemHeight,
    },
    wheel: { discretePaging: true },
    gesture: { lockAxis: true, ignoreWhileAnimating: false },
  });

  const totalHeight = deck.totalSize;

  return (
    <div
      {...deck.getViewportProps()}
      className="w-full h-full overflow-hidden relative"
      style={{ ...deck.getViewportProps().style, touchAction: 'none' }}
    >
      <div style={{ height: totalHeight, position: "relative", width: "100%" }}>
        {deck.virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              {...deck.getItemProps(virtualItem.index)}
              className="absolute w-full"
              style={{
                ...deck.getItemProps(virtualItem.index).style,
                left: 0,
                top: 0,
                transform: `translateY(${virtualItem.offset}px)`,
                height: virtualItem.size,
              }}
            >
              <VideoCard item={item} isActive={deck.index === virtualItem.index} />
            </div>
          )
        })}
      </div>
    </div>
  );
}

// --- App ---

function App() {
  const [mode, setMode] = useState<FeedMode>("native");

  const items = mode === "native" ? SMALL_DATA_SET : LARGE_DATA_SET;

  return (
    <main className="w-full h-full relative" style={{ color: 'white', background: 'black' }}>
      {/* Header */}
      <header className="absolute top-nav w-full flex justify-between items-start px-4" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
        <div style={{ width: '40px' }}>
          {/* Live Icon Removed */}
        </div>

        <div className="nav-links flex items-center justify-center">
          <button
            onClick={() => setMode("native")}
            className={mode === "native" ? "nav-link-active" : ""}
            style={{ background: 'none', border: 'none', color: mode === "native" ? 'white' : 'rgba(255,255,255,0.6)', fontSize: '16px', fontWeight: '700', cursor: 'pointer', paddingBottom: '4px' }}
          >
            Native
          </button>
          <span style={{ opacity: 0.2 }}>|</span>
          <button
            onClick={() => setMode("virtualized")}
            className={mode === "virtualized" ? "nav-link-active" : ""}
            style={{ background: 'none', border: 'none', color: mode === "virtualized" ? 'white' : 'rgba(255,255,255,0.6)', fontSize: '16px', fontWeight: '700', cursor: 'pointer', paddingBottom: '4px' }}
          >
            Virtualized
          </button>
        </div>

        <div style={{ width: '40px', display: 'flex', justifyContent: 'flex-end' }}>
          {/* Search Icon Removed */}
        </div>
      </header>

      {/* Content */}
      <div className="w-full h-full">
        {mode === "native" ? (
          <NativeFeed items={items} />
        ) : (
          <VirtualizedFeed items={items} />
        )}
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
        <div className="upload-wrapper"> {/* wrapper for centering */}
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
