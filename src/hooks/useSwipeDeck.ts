import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clamp } from "../utils/clamp";
import { prefersReducedMotion } from "../utils/prefersReducedMotion";
import { useGestures } from "./useGestures";
import { useWheel } from "./useWheel";
import { useKeyboard } from "./useKeyboard";
import { useVisibility } from "./useVisibility";
import { useVirtualizer } from "./useVirtualizer";
import { useScrollTo } from "./useScrollTo";
import type {
  Direction,
  IndexChangeSource,
  Mode,
  Orientation,
  ScrollBehavior,
  SwipeDeckAPI,
  SwipeDeckOptions,
  SwipeDeckState,
} from "../types";

const DEFAULTS = {
  orientation: "vertical" as Orientation,
  mode: "auto" as Mode,
  direction: "ltr" as Direction,
  loop: false,
  defaultIndex: 0,
  gesture: {
    threshold: 50,
    flickVelocity: 0.5,
    lockAxis: true,
    ignoreWhileAnimating: true,
  },
  wheel: {
    discretePaging: true,
    threshold: 50,
    debounce: 150,
  },
  keyboard: {
    enabled: true,
  },
  visibility: {
    strategy: "position" as const,
    intersectionRatio: 0.6,
    debounce: 100,
  },
  virtual: {
    overscan: 2,
  },
  endReachedThreshold: 3,
  ariaLabel: "Swipe feed",
  keyboardNavigation: true,
};

export function useSwipeDeck<T>(options: SwipeDeckOptions<T>): SwipeDeckAPI<T> {
  const items = options.items ?? [];
  const orientation = options.orientation ?? DEFAULTS.orientation;
  const direction = options.direction ?? DEFAULTS.direction;
  const mode = options.mode ?? DEFAULTS.mode;
  const loop = options.loop ?? DEFAULTS.loop;
  const defaultIndex = options.defaultIndex ?? DEFAULTS.defaultIndex;

  const gestureCfg = { ...DEFAULTS.gesture, ...(options.gesture ?? {}) };
  const wheelCfg = { ...DEFAULTS.wheel, ...(options.wheel ?? {}) };
  const keyboardCfg = { ...DEFAULTS.keyboard, ...(options.keyboard ?? {}) };
  const visibilityCfg = { ...DEFAULTS.visibility, ...(options.visibility ?? {}) };
  const virtualCfg = { ...DEFAULTS.virtual, ...(options.virtual ?? {}) };
  const endReachedThreshold = options.endReachedThreshold ?? DEFAULTS.endReachedThreshold;
  const ariaLabel = options.ariaLabel ?? DEFAULTS.ariaLabel;
  const keyboardNavigation = options.keyboardNavigation ?? true;

  const resolvedMode: "native" | "virtualized" = useMemo(() => {
    if (mode === "auto") {
      return items.length < 50 ? "native" : "virtualized";
    }
    return mode === "native" ? "native" : "virtualized";
  }, [items.length, mode]);

  const isControlled = typeof options.index === "number";
  const [internalIndex, setInternalIndex] = useState(() => clamp(defaultIndex, 0, Math.max(items.length - 1, 0)));
  const index = isControlled ? clamp(options.index ?? 0, 0, Math.max(items.length - 1, 0)) : internalIndex;

  const [isAnimating, setIsAnimating] = useState(false);
  const viewportRef = useRef<HTMLElement | null>(null);
  const sourceRef = useRef<IndexChangeSource>("snap");

  useEffect(() => {
    // Clamp index when items change
    const clamped = clamp(index, 0, Math.max(items.length - 1, 0));
    if (!isControlled) setInternalIndex(clamped);
  }, [index, isControlled, items.length]);

  const virtualItems = useVirtualizer({
    items,
    virtual: virtualCfg,
    resolvedMode,
  });

  const { scrollToIndex } = useScrollTo({
    getViewport: () => viewportRef.current,
    setAnimating: setIsAnimating,
  });

  const getItemOffset = useCallback(
    (i: number) => virtualItems.find(v => v.index === i)?.offset ?? i * (typeof virtualCfg.estimatedSize === "number" ? virtualCfg.estimatedSize : 800),
    [virtualCfg.estimatedSize, virtualItems],
  );
  const getItemSize = useCallback(
    (i: number) => virtualItems.find(v => v.index === i)?.size ?? (typeof virtualCfg.estimatedSize === "number" ? virtualCfg.estimatedSize : 800),
    [virtualCfg.estimatedSize, virtualItems],
  );

  const applyIndexChange = useCallback(
    (nextIndex: number) => {
      if (nextIndex === index) return;
      if (!isControlled) setInternalIndex(nextIndex);
      options.onIndexChange?.(nextIndex, sourceRef.current ?? "snap");
      setIsAnimating(false);
      sourceRef.current = "snap";
    },
    [index, isControlled, options],
  );

  const visibility = useVisibility({
    itemCount: items.length,
    getItemOffset,
    getItemSize,
    strategy: visibilityCfg.strategy ?? "position",
    intersectionRatio: visibilityCfg.intersectionRatio ?? 0.6,
    debounceMs: visibilityCfg.debounce ?? 100,
    onActive: applyIndexChange,
  });

  const navigateTo = useCallback(
    (targetIndex: number, source: IndexChangeSource, behavior?: ScrollBehavior) => {
      if (items.length === 0) return;
      const maxIndex = items.length - 1;
      let next = targetIndex;
      if (loop) {
        next = (next + items.length) % items.length;
      } else {
        next = clamp(next, 0, maxIndex);
      }
      sourceRef.current = source;
      const offset = getItemOffset(next);
      const scrollBehavior = behavior ?? (prefersReducedMotion() ? "instant" : "smooth");
      scrollToIndex(offset, scrollBehavior);
      if (!isControlled && resolvedMode === "virtualized" && scrollBehavior === "instant") {
        applyIndexChange(next);
      }
    },
    [applyIndexChange, getItemOffset, isControlled, items.length, loop, resolvedMode, scrollToIndex],
  );

  const wheel = useWheel({
    orientation,
    direction,
    discretePaging: wheelCfg.discretePaging ?? true,
    threshold: wheelCfg.threshold ?? 50,
    debounce: wheelCfg.debounce ?? 150,
    onRequestIndexChange: delta => navigateTo(index + delta, "user:wheel"),
  });

  const gestures = useGestures({
    orientation,
    direction,
    threshold: gestureCfg.threshold ?? 50,
    flickVelocity: gestureCfg.flickVelocity ?? 0.5,
    lockAxis: gestureCfg.lockAxis ?? true,
    ignoreWhileAnimating: gestureCfg.ignoreWhileAnimating ?? true,
    loop,
    getIndex: () => index,
    maxIndex: Math.max(items.length - 1, 0),
    onRequestIndexChange: next => navigateTo(next, "user:gesture"),
    setAnimating: setIsAnimating,
  });

  const keyboard = useKeyboard({
    orientation,
    direction,
    config: keyboardNavigation ? keyboardCfg : { enabled: false },
    onPrev: () => navigateTo(index - 1, "user:keyboard"),
    onNext: () => navigateTo(index + 1, "user:keyboard"),
    onFirst: () => navigateTo(0, "user:keyboard"),
    onLast: () => navigateTo(items.length - 1, "user:keyboard"),
  });

  const handleScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const scrollOffset = orientation === "vertical" ? viewport.scrollTop : viewport.scrollLeft;
    const viewportSize = orientation === "vertical" ? viewport.clientHeight : viewport.clientWidth;
    visibility.calculateFromPosition(scrollOffset, viewportSize);
  }, [orientation, visibility]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    handleScroll();
  }, [handleScroll]);

  // onEndReached
  useEffect(() => {
    if (items.length === 0) return;
    const maxIndex = items.length - 1;
    const distanceFromEnd = maxIndex - index;
    if (distanceFromEnd <= endReachedThreshold) {
      options.onEndReached?.({ distanceFromEnd, direction: "forward" });
    }
    if (index <= endReachedThreshold) {
      options.onEndReached?.({ distanceFromEnd: index, direction: "backward" });
    }
  }, [endReachedThreshold, index, items.length, options]);

  const scrollBehavior = useMemo(
    () => (prefersReducedMotion() ? "instant" : "smooth"),
    [],
  );

  const scrollTo = useCallback(
    (target: number, opts?: { behavior?: ScrollBehavior }) => {
      navigateTo(target, "programmatic", opts?.behavior ?? scrollBehavior);
    },
    [navigateTo, scrollBehavior],
  );

  const apiState: SwipeDeckState = useMemo(
    () => ({
      index,
      isAnimating,
      canPrev: loop || index > 0,
      canNext: loop || index < items.length - 1,
      resolvedMode,
    }),
    [index, isAnimating, items.length, loop, resolvedMode],
  );

  const getViewportProps = useCallback(() => {
    const isVertical = orientation === "vertical";
    const nativeScrollStyles: React.CSSProperties =
      resolvedMode === "native"
        ? {
            overflowY: isVertical ? "auto" : "hidden",
            overflowX: isVertical ? "hidden" : "auto",
            scrollSnapType: isVertical ? "y mandatory" : "x mandatory",
            overscrollBehavior: "contain",
            position: "relative" as const,
          }
        : ({ position: "relative", overflow: "auto" } as React.CSSProperties);

    return {
      ref: (el: HTMLElement | null) => {
        viewportRef.current = el;
      },
      role: "feed",
      "aria-label": ariaLabel,
      "aria-busy": isAnimating,
      tabIndex: 0,
      onScroll: handleScroll,
      onWheel: wheel.onWheel,
      onKeyDown: keyboard.onKeyDown,
      ...gestures.handlers,
      style: nativeScrollStyles,
    } satisfies React.HTMLAttributes<HTMLElement> & { ref: React.RefCallback<HTMLElement> };
  }, [ariaLabel, gestures.handlers, handleScroll, isAnimating, keyboard.onKeyDown, resolvedMode, wheel.onWheel, orientation]);

  const getItemProps = useCallback(
    (itemIndex: number) => {
      const virtual = virtualItems.find(v => v.index === itemIndex);
      const isActive = index === itemIndex;

      if (resolvedMode === "virtualized" && virtual) {
        return {
          ref: () => {},
          "data-index": itemIndex,
          "data-active": isActive,
          style: {
            position: "absolute",
            insetInlineStart: 0,
            insetBlockStart: virtual.offset,
            blockSize: virtual.size,
            inlineSize: "100%",
            willChange: "transform",
          },
        } as const;
      }

      return {
        ref: () => {},
        "data-index": itemIndex,
        "data-active": isActive,
        style: {
          scrollSnapAlign: "start",
          scrollSnapStop: "always",
        },
      } as const;
    },
    [index, resolvedMode, virtualItems],
  );

  const api: SwipeDeckAPI<T> = {
    ...apiState,
    prev: () => navigateTo(index - 1, "user:keyboard"),
    next: () => navigateTo(index + 1, "user:keyboard"),
    scrollTo,
    getViewportProps,
    getItemProps,
    virtualItems: resolvedMode === "native" ? virtualItems : virtualItems,
    items,
  };

  return api;
}

