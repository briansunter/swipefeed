import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { SwipeDeck } from "../components/SwipeDeck";

type DemoItem = { id: string; title: string };

const smallItems = Array.from({ length: 5 }, (_, i) => ({
  id: `art-${i}`,
  title: `Artwork #${i + 1}`,
}));

const largeItems = Array.from({ length: 60 }, (_, i) => ({
  id: `vid-${i}`,
  title: `Video #${i + 1}`,
}));

const storiesItems = Array.from({ length: 10 }, (_, i) => ({
  id: `story-${i}`,
  title: `Story ${i + 1}`,
}));

const meta = {
  title: "SwipeDeck/Examples",
  component: SwipeDeck as unknown as React.ComponentType<import("../types").SwipeDeckProps<DemoItem>>,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SwipeDeck>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VerticalNative: Story = {
  args: {
    items: smallItems,
    orientation: "vertical",
    children: ({ item, props, isActive }: { item: DemoItem; props: React.HTMLAttributes<HTMLElement>; isActive: boolean }) => {
      const typed = item as DemoItem;
      return (
        <div
          {...props}
          style={{
            height: "80vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isActive ? "#0ea5e9" : "#0f172a",
            color: "white",
          }}
        >
          {typed.title} {isActive ? "(active)" : ""}
        </div>
      );
    },
  },
};

export const VirtualizedFeed: Story = {
  args: {
    items: largeItems,

    virtual: { estimatedSize: 600 },
    orientation: "vertical",
    children: ({ item, props, isActive }: { item: DemoItem; props: React.HTMLAttributes<HTMLElement>; isActive: boolean }) => {
      const typed = item as DemoItem;
      return (
        <div
          {...props}
          style={{
            position: "absolute",
            inset: 0,
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isActive ? "#22c55e" : "#0f172a",
            color: "white",
          }}
        >
          {typed.title}
        </div>
      );
    },
  },
};

export const HorizontalStories: Story = {
  args: {
    items: storiesItems,
    orientation: "horizontal",

    loop: true,
    wheel: { discretePaging: false },
    children: ({ item, props, isActive }: { item: DemoItem; props: React.HTMLAttributes<HTMLElement>; isActive: boolean }) => {
      const typed = item as DemoItem;
      return (
        <div
          {...props}
          style={{
            width: 220,
            height: 320,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 8px",
            background: isActive ? "#a855f7" : "#1f2937",
            color: "white",
            borderRadius: 12,
          }}
        >
          {typed.title}
        </div>
      );
    },
  },
};

export const Controlled: Story = {
  render: (args: { items?: readonly DemoItem[] }) => {
    const [index, setIndex] = React.useState(0);
    const safeItems = (args.items ?? smallItems) as readonly DemoItem[];
    return (
      <SwipeDeck items={safeItems} index={index} onIndexChange={setIndex}>
        {({ item, props, isActive }: { item: DemoItem; props: React.HTMLAttributes<HTMLElement>; isActive: boolean }) => {
          const typed = item as DemoItem;
          return (
            <div
              {...props}
              style={{
                height: "80vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isActive ? "#f59e0b" : "#0f172a",
                color: "white",
              }}
            >
              {typed.title} (index {index})
            </div>
          );
        }}
      </SwipeDeck>
    );
  },
  args: {
    items: smallItems,
    // placeholder children for type satisfaction; render overrides
    children: ({ item, props }: { item: DemoItem; props: React.HTMLAttributes<HTMLElement> }) => (
      <div {...props}>{item.title}</div>
    ),
  },
};

