import type React from "react";
import type { JSX } from "react";
export type Orientation = "vertical" | "horizontal";
export type Direction = "ltr" | "rtl";
export type ScrollBehavior = "smooth" | "instant" | "auto";

export type IndexChangeSource =
  | "user:gesture"
  | "user:wheel"
  | "user:keyboard"
  | "programmatic"
  | "snap";

export interface GestureConfig {
  threshold?: number;
  flickVelocity?: number;
  lockAxis?: boolean;
  ignoreWhileAnimating?: boolean;
}

export interface WheelConfig {
  discretePaging?: boolean;
  threshold?: number;
  debounce?: number;
  cooldown?: number;
}

export interface KeyboardConfig {
  enabled?: boolean;
  global?: boolean;
  bindings?: {
    prev?: string[];
    next?: string[];
    first?: string[];
    last?: string[];
    altPrev?: string[];
    altNext?: string[];
  };
}

export interface VisibilityConfig {
  strategy?: "position" | "intersection";
  intersectionRatio?: number;
  debounce?: number;
}

export interface VirtualConfig {
  overscan?: number;
  estimatedSize?: number | ((item: unknown, index: number) => number);
  getItemKey?: (item: unknown, index: number) => string | number;
}

export interface SwipeDeckOptions<T> {
  items: readonly T[];
  orientation?: Orientation;
  direction?: Direction;
  defaultIndex?: number;
  index?: number;
  onIndexChange?: (index: number, source: IndexChangeSource) => void;
  loop?: boolean;
  preload?: number; // Number of items to preload next
  preloadPrevious?: number; // Number of items to keep preloaded from previous
  gesture?: GestureConfig;
  wheel?: WheelConfig;
  keyboard?: KeyboardConfig;
  visibility?: VisibilityConfig;
  virtual?: VirtualConfig;
  onItemActive?: (item: T, index: number) => void;
  onItemInactive?: (item: T, index: number) => void;
  onEndReached?: (info: { distanceFromEnd: number; direction: "forward" | "backward" }) => void;
  endReachedThreshold?: number;
  ariaLabel?: string;
  keyboardNavigation?: boolean;
}

export interface SwipeDeckState {
  index: number;
  isAnimating: boolean;
  canPrev: boolean;
  canNext: boolean;
}

export interface SwipeDeckActions {
  prev: () => void;
  next: () => void;
  scrollTo: (index: number, options?: { behavior?: ScrollBehavior }) => void;
}

export interface SwipeDeckVirtualItem {
  index: number;
  offset: number;
  size: number;
  key: string | number;
  measureElement?: (el: Element | null) => void;
}

export interface SwipeDeckAPI<T> extends SwipeDeckState, SwipeDeckActions {
  getViewportProps: () => React.HTMLAttributes<HTMLElement> & {
    ref: React.RefCallback<HTMLElement>;
  };
  getItemProps: (index: number) => React.HTMLAttributes<HTMLElement> & {
    ref?: React.RefCallback<HTMLElement>;
    "data-index": number;
    "data-active": boolean;
  };
  virtualItems: SwipeDeckVirtualItem[];
  totalSize: number;
  items: readonly T[];
  orientation: Orientation;
  viewport: HTMLElement | null;
}

export interface SwipeDeckRenderContext<T> {
  item: T;
  index: number;
  isActive: boolean;
  shouldPreload: boolean;
  props: ReturnType<SwipeDeckAPI<T>["getItemProps"]>;
}

export interface SwipeDeckProps<T> extends SwipeDeckOptions<T> {
  as?: keyof JSX.IntrinsicElements | React.ComponentType<unknown>;
  children: (context: SwipeDeckRenderContext<T>) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /**
   * If true, applies styles to make the deck take up the full view height (100dvh) and width (100%).
   * Helpful for full-screen video feeds to handle browser UI (address bar) correctly.
   */
  fullscreen?: boolean;
}

export interface SwipeDeckHandle extends SwipeDeckActions {
  getState: () => SwipeDeckState;
  viewport: HTMLElement | null;
}

