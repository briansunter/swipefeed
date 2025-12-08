import { createRoot } from "react-dom/client";
import type React from "react";
import { useMemo, useState } from "react";
import { SwipeDeck, useSwipeDeck } from "../src";

type DemoItem = { id: string; title: string; description: string };

const pageBackground =
  "radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.18), transparent 35%), radial-gradient(circle at 80% 0%, rgba(34, 211, 238, 0.18), transparent 30%), #0b1020";

const glassPanel: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
  borderRadius: 18,
  padding: "18px 18px 20px",
};

const baseCardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "flex-start",
  gap: "0.5rem",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
  color: "#f8fafc",
  boxShadow: "0 16px 40px rgba(0,0,0,0.32)",
};

const badgeStyle = (tone: "teal" | "indigo" | "amber" = "teal"): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  padding: "6px 10px",
  borderRadius: 999,
  color: tone === "amber" ? "#fef3c7" : tone === "indigo" ? "#e0e7ff" : "#d1fae5",
  background:
    tone === "amber"
      ? "rgba(251, 191, 36, 0.12)"
      : tone === "indigo"
        ? "rgba(129, 140, 248, 0.14)"
        : "rgba(45, 212, 191, 0.12)",
  border: "1px solid rgba(255,255,255,0.08)",
});

function Pill({ tone = "teal", children }: { tone?: "teal" | "indigo" | "amber"; children: React.ReactNode }) {
  return <span style={badgeStyle(tone)}>{children}</span>;
}

function SectionShell({
  id,
  label,
  title,
  description,
  badgeTone,
  children,
  toolbar,
}: {
  id?: string;
  label: string;
  title: string;
  description: string;
  badgeTone?: "teal" | "indigo" | "amber";
  children: React.ReactNode;
  toolbar?: React.ReactNode;
}) {
  return (
    <section id={id} style={{ ...glassPanel, padding: 20, display: "grid", gap: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Pill tone={badgeTone}>{label}</Pill>
          <div>
            <h2 style={{ margin: "6px 0 4px", fontSize: 22, letterSpacing: -0.2 }}>{title}</h2>
            <p style={{ margin: 0, color: "#cbd5e1" }}>{description}</p>
          </div>
        </div>
        {toolbar ? <div style={{ display: "flex", gap: 8 }}>{toolbar}</div> : null}
      </header>
      {children}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        ...glassPanel,
        padding: "14px 16px",
        display: "grid",
        gap: 6,
        minWidth: 0,
      }}
    >
      <span style={{ color: "#94a3b8", fontSize: 12, letterSpacing: 0.2 }}>{label}</span>
      <strong style={{ fontSize: 18 }}>{value}</strong>
    </div>
  );
}

function VerticalNative({ items }: { items: DemoItem[] }) {
  return (
    <div style={{ height: 520, borderRadius: 16, overflow: "hidden" }}>
      <SwipeDeck items={items} orientation="vertical" onItemActive={item => console.log("active", item.id)}>
        {({ item, props, isActive }) => (
          <div
            {...props}
            style={{
              ...baseCardStyle,
              height: "100%",
              padding: "2rem",
              width: "100%",
              opacity: isActive ? 1 : 0.55,
              transition: "opacity 150ms ease, transform 200ms ease",
              transform: isActive ? "translateY(0)" : "translateY(2px)",
            }}
          >
            <Pill tone="teal">Native scroll-snap</Pill>
            <h3 style={{ margin: "4px 0" }}>{item.title}</h3>
            <p style={{ color: "#cbd5e1", margin: 0 }}>{item.description}</p>
            <small style={{ color: "#94a3b8" }}>Swipe / wheel to move</small>
          </div>
        )}
      </SwipeDeck>
    </div>
  );
}

function VirtualizedFeed({ items }: { items: DemoItem[] }) {
  const deck = useSwipeDeck({
    items,
    mode: "virtualized",
    orientation: "vertical",
  });

  return (
    <div
      {...deck.getViewportProps()}
      style={{
        height: 520,
        borderRadius: 16,
        overflow: "auto",
        position: "relative",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <div
        style={{
          position: "relative",
          height: deck.virtualItems.length
            ? (deck.virtualItems.at(-1)?.offset ?? 0) + (deck.virtualItems.at(-1)?.size ?? 0)
            : 0,
        }}
      >
        {deck.virtualItems.map(v => {
          const item = items[v.index];
          const props = deck.getItemProps(v.index);
          const isActive = deck.index === v.index;
          return (
            <div
              key={v.key}
              {...props}
              style={{
                ...(props.style as React.CSSProperties),
                ...baseCardStyle,
                padding: "1.4rem 1.6rem",
                margin: "10px 12px",
                opacity: isActive ? 1 : 0.62,
                borderColor: isActive ? "rgba(34,211,238,0.4)" : baseCardStyle.border,
              }}
            >
              <Pill tone="indigo">Virtualized</Pill>
              <h3 style={{ margin: "4px 0" }}>{item.title}</h3>
              <p style={{ color: "#cbd5e1", margin: "0 0 2px" }}>{item.description}</p>
              <small style={{ color: "#94a3b8" }}>Renders only visible cards for large lists</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HorizontalStories({ items }: { items: DemoItem[] }) {
  const [rtl, setRtl] = useState(false);
  const deck = useSwipeDeck({
    items,
    orientation: "horizontal",
    mode: "native",
    direction: rtl ? "rtl" : "ltr",
    loop: true,
    wheel: { discretePaging: false },
  });

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setRtl(v => !v)}
          style={{
            ...glassPanel,
            padding: "10px 12px",
            borderRadius: 12,
            cursor: "pointer",
            color: "#e2e8f0",
          }}
        >
          Toggle direction • {rtl ? "rtl" : "ltr"}
        </button>
      </div>
      <div
        {...deck.getViewportProps()}
        dir={rtl ? "rtl" : "ltr"}
        style={{
          display: "flex",
          gap: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          padding: 12,
          overflowX: "auto",
          maxWidth: "100%",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        {deck.virtualItems.map(v => {
          const item = items[v.index];
          const props = deck.getItemProps(v.index);
          const isActive = deck.index === v.index;
          return (
            <div
              key={v.key}
              {...props}
              style={{
                ...(props.style as React.CSSProperties),
                ...baseCardStyle,
                width: 210,
                padding: "1rem",
                opacity: isActive ? 1 : 0.72,
                alignItems: "flex-start",
              }}
            >
              <Pill tone="amber">Loop + RTL</Pill>
              <h4 style={{ margin: "6px 0 2px" }}>{item.title}</h4>
              <p style={{ margin: 0, color: "#cbd5e1", fontSize: 13 }}>Swipe / wheel horizontally</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ControlledWithQuery({ items }: { items: DemoItem[] }) {
  const params = new URLSearchParams(window.location.search);
  const initial = Number.parseInt(params.get("i") ?? "0", 10) || 0;
  const [idx, setIdx] = useState(initial);
  const deck = useSwipeDeck({
    items,
    index: idx,
    onIndexChange: newIndex => {
      setIdx(newIndex);
      const search = new URLSearchParams(window.location.search);
      search.set("i", String(newIndex));
      const url = `${window.location.pathname}?${search.toString()}`;
      window.history.replaceState(null, "", url);
    },
  });

  return (
    <div style={{ height: 360, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div {...deck.getViewportProps()} style={{ height: "100%", position: "relative" }}>
        {deck.virtualItems.map(v => {
          const item = items[v.index];
          const props = deck.getItemProps(v.index);
          return (
            <div
              key={v.key}
              {...props}
              style={{
                ...(props.style as React.CSSProperties),
                ...baseCardStyle,
                height: "100%",
                padding: "1.6rem",
                gap: "0.4rem",
              }}
            >
              <Pill tone="indigo">Controlled</Pill>
              <h4 style={{ margin: "6px 0 0" }}>{item.title}</h4>
              <p style={{ color: "#cbd5e1", margin: 0 }}>Index synced with URL param (?i=)</p>
              <small style={{ color: "#94a3b8" }}>Current index: {deck.index}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function App() {
  const smallItems = useMemo<DemoItem[]>(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: `art-${i}`,
        title: `Artwork #${i + 1}`,
        description: "Native scroll-snap demo",
      })),
    [],
  );

  const largeItems = useMemo<DemoItem[]>(
    () =>
      Array.from({ length: 120 }, (_, i) => ({
        id: `vid-${i}`,
        title: `Video #${i + 1}`,
        description: "Virtualized list demo",
      })),
    [],
  );

  const stories = useMemo<DemoItem[]>(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: `story-${i}`,
        title: `Story ${i + 1}`,
        description: "Horizontal loop demo",
      })),
    [],
  );

  const heroFeatures = ["Native + virtualized", "Loop + RTL", "Wheel + gestures", "URL state control"];

  return (
    <main
      style={{
        color: "#e2e8f0",
        background: pageBackground,
        minHeight: "100vh",
        fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "2.5rem 1.25rem 3rem", display: "grid", gap: 18 }}>
        <header
          style={{
            ...glassPanel,
            display: "grid",
            gridTemplateColumns: "minmax(280px, 1fr) minmax(260px, 0.8fr)",
            gap: 20,
          }}
        >
          <div style={{ display: "grid", gap: 10 }}>
            <Pill tone="teal">Examples</Pill>
            <h1
              style={{
                margin: 0,
                fontSize: 32,
                letterSpacing: -0.5,
                background: "linear-gradient(120deg, #a5b4fc, #2dd4bf)",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              @brian/tiktok-swipe playground
            </h1>
            <p style={{ margin: 0, color: "#cbd5e1" }}>
              Built to mirror the library&apos;s spec: native scroll-snap, virtualized feeds, horizontal stories with RTL
              support, and external control.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {heroFeatures.map(feature => (
                <Pill key={feature} tone="indigo">
                  {feature}
                </Pill>
              ))}
            </div>
          </div>
          <div
            style={{
              ...glassPanel,
              background: "linear-gradient(135deg, rgba(45,212,191,0.12), rgba(59,130,246,0.12))",
              borderColor: "rgba(255,255,255,0.12)",
              display: "grid",
              gap: 10,
            }}
          >
            <strong style={{ fontSize: 20 }}>Try it live</strong>
            <p style={{ margin: 0, color: "#e2e8f0" }}>Scroll, drag, or wheel on each surface to feel the modes.</p>
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
              <StatCard label="Modes" value="Native • Virtualized" />
              <StatCard label="Layouts" value="Vertical • Horizontal" />
              <StatCard label="Control" value="Loop • RTL • URL sync" />
            </div>
          </div>
        </header>

        <div style={{ display: "grid", gap: 14 }}>
          <SectionShell
            id="vertical"
            label="Native"
            badgeTone="teal"
            title="Vertical feed with snap points"
            description="Viewport-aware snapping with onItemActive events."
          >
            <VerticalNative items={smallItems} />
          </SectionShell>

          <SectionShell
            id="virtualized"
            label="Virtualized"
            badgeTone="indigo"
            title="Large lists stay fast"
            description="Only visible cards render; smooth wheel + touch interactions."
          >
            <VirtualizedFeed items={largeItems} />
          </SectionShell>

          <SectionShell
            id="stories"
            label="Horizontal"
            badgeTone="amber"
            title="Looping stories with RTL toggle"
            description="Native horizontal flow, discrete or smooth wheel, and direction control."
          >
            <HorizontalStories items={stories} />
          </SectionShell>

          <SectionShell
            id="controlled"
            label="Controlled"
            badgeTone="indigo"
            title="Sync the active card to the URL"
            description="Keep state in the address bar so refreshes and shares stay in sync."
            toolbar={<Pill tone="amber">?i= index</Pill>}
          >
            <ControlledWithQuery items={smallItems} />
          </SectionShell>
        </div>
      </div>
    </main>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}

