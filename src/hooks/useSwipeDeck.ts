import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clamp } from "../utils/clamp";
import { prefersReducedMotion } from "../utils/prefersReducedMotion";
import { useGestures } from "./useGestures";
import { useWheel } from "./useWheel";
import { useKeyboard } from "./useKeyboard";
import { useVirtualizer } from "./useVirtualizer";
import type {
  Direction,
  IndexChangeSource,
  Orientation,
  ScrollBehavior,
  SwipeDeckAPI,
  SwipeDeckOptions,
  SwipeDeckState,
} from "../types";

const DEFAULTS = {
  orientation: "vertical" as Orientation,
  direction: "ltr" as Direction,
  loop: false,
  defaultIndex: 0,
  gesture: {
    threshold: 10,
    flickVelocity: 0.1,
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
    overscan: 5,
  },
  endReachedThreshold: 3,
  ariaLabel: "Swipe feed",
  keyboardNavigation: true,
};

export function useSwipeDeck<T>(options: SwipeDeckOptions<T>): SwipeDeckAPI<T> {
  const items = options.items ?? [];
  const orientation = options.orientation ?? DEFAULTS.orientation;
  const direction = options.direction ?? DEFAULTS.direction;
  const loop = options.loop ?? DEFAULTS.loop;
  const defaultIndex = options.defaultIndex ?? DEFAULTS.defaultIndex;

  const gestureCfg = { ...DEFAULTS.gesture, ...(options.gesture ?? {}) };
  const wheelCfg = { ...DEFAULTS.wheel, ...(options.wheel ?? {}) };
  const keyboardCfg = { ...DEFAULTS.keyboard, ...(options.keyboard ?? {}) };
  const virtualCfg = { ...DEFAULTS.virtual, ...(options.virtual ?? {}) };
  const endReachedThreshold = options.endReachedThreshold ?? DEFAULTS.endReachedThreshold;
  const ariaLabel = options.ariaLabel ?? DEFAULTS.ariaLabel;
  const keyboardNavigation = options.keyboardNavigation ?? true;

  const isControlled = typeof options.index === "number";
  const [internalIndex, setInternalIndex] = useState(() => clamp(defaultIndex, 0, Math.max(items.length - 1, 0)));
  const index = isControlled ? clamp(options.index ?? 0, 0, Math.max(items.length - 1, 0)) : internalIndex;

  const [isAnimating, setIsAnimating] = useState(false);
  const viewportRef = useRef<HTMLElement | null>(null);
  const sourceRef = useRef<IndexChangeSource>("snap");
  const dragStartScrollRef = useRef<number>(0);

  useEffect(() => {
    // Clamp index when items change
    const clamped = clamp(index, 0, Math.max(items.length - 1, 0));
    if (!isControlled) setInternalIndex(clamped);
  }, [index, isControlled, items.length]);

  const virtualizer = useVirtualizer({
    items,
    virtual: virtualCfg,
    getScrollElement: () => viewportRef.current,
    orientation,
  });

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

      const targetBehavior = behavior ?? (prefersReducedMotion() ? "instant" : "smooth");

      // Optimization: trigger 'auto' scroll in JS, let CSS 'scroll-behavior: smooth' handle the animation
      // This reduces JS main thread work and jitter.
      // However, if we want 'instant', we rely on the fact that 'instant' usually overrides or we might need to handle it.
      // For now, focusing on the "Native/Smooth" case.

      // CRITICAL FIX: explicit style override to ensure smooth snap
      // React state update for 'isDragging' is too slow (happens after this call).
      // We must force the visual style to 'smooth' BEFORE calling scroll.
      if (source === 'user:gesture' && targetBehavior === 'smooth' && viewportRef.current) {
        viewportRef.current.style.scrollBehavior = 'smooth';
      }

      virtualizer.scrollToIndex(next, { behavior: 'auto', align: 'start' });

      // We might need to manually trigger index change event if virtualizer doesn't invoke a callback that we can hook into.
      // In virtualized mode with windowing, we rely on scroll position to determine active index usually.
      // BUT if we are programmatically navigating, we want to update the index state.
      if (targetBehavior === 'instant' || !isControlled) {
        applyIndexChange(next);
      }
    },
    [applyIndexChange, isControlled, items.length, loop, virtualizer.scrollToIndex],
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
    isAnimating,
    onDragStart: () => {
      if (viewportRef.current) {
        // Optimization: Force auto behavior immediately on drag start
        viewportRef.current.style.scrollBehavior = 'auto';
        dragStartScrollRef.current = orientation === "vertical" ? viewportRef.current.scrollTop : viewportRef.current.scrollLeft;
      }
    },
    onDrag: (delta) => {
      if (viewportRef.current) {
        const newScroll = dragStartScrollRef.current - delta;
        if (orientation === "vertical") {
          viewportRef.current.scrollTop = newScroll;
        } else {
          viewportRef.current.scrollLeft = newScroll;
        }
        // Force immediate scroll handling for smooth drag
        // Note: setting scrollTop fires 'scroll' event asynchronously generally, but
        // some browsers might fire it fast. We rely on the event listener.
      }
    }
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

  // Calculate visibility based on scroll
  // Note: virtual-core has its own range detection, but for "snapping" logic or updating active index, 
  // we might still want this.
  // HOWEVER, updating 'setInternalIndex' causes re-renders.
  // We should be careful not to fight with virtualizer.
  // virtualizer.range gives us visible items. 
  // We want the "Main" active item (center).
  const rafId = useRef<number | null>(null);

  const handleScroll = useCallback(() => {
    if (rafId.current !== null) return;

    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      const viewport = viewportRef.current;
      if (!viewport) return;
      const scrollOffset = orientation === "vertical" ? viewport.scrollTop : viewport.scrollLeft;
      const viewportSize = orientation === "vertical" ? viewport.clientHeight : viewport.clientWidth;

      // Efficiently find active index without looping all
      // We can use virtualizer.virtualItems from the closure, 
      // but ideally we want fresh state if possible. 
      // Luckily validation runs often.
      const visible = virtualizer.virtualItems;
      if (visible.length > 0) {
        // Find the one covering center
        const center = scrollOffset + viewportSize / 2;
        const match = visible.find(v => {
          const end = v.offset + v.size;
          return v.offset <= center && end >= center;
        });
        if (match) {
          applyIndexChange(match.index);
        }
      }
    });

    // visibility.calculateFromPosition(scrollOffset, viewportSize); // DISABLE OLD LOOP
  }, [orientation, virtualizer.virtualItems, applyIndexChange]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    // We attach scroll listener in virtualizer for ITs purposes.
    // But we also need one for updating SwipeDeck State (index).
    // And to support `wheel` which we attach to props.
    // Virtualizer attaches its own listener for rendering.
    // We validly can have multiple listeners.
  }, []);

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
    }),
    [index, isAnimating, items.length, loop],
  );

  const getViewportProps = useCallback(() => {
    // const isVertical = orientation === "vertical";
    const virtualStyles: React.CSSProperties = {
      position: "relative",
      overflow: "auto",
      // Native Scroll Snap
      scrollSnapType: orientation === "vertical" ? "y mandatory" : "x mandatory",
      // Ensure native scroll works
      touchAction: orientation === "vertical" ? "pan-y" : "pan-x",

      // Remove manual scroll-behavior toggling, let snap handle it
      // scrollBehavior: "smooth", 
      willChange: "scroll-position", // Optimizes scrolling
    };

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
      // Disable manual gesture handlers for drag to allow native scroll
      // ...gestures.handlers, 
      style: virtualStyles,
    } satisfies React.HTMLAttributes<HTMLElement> & { ref: React.RefCallback<HTMLElement> };
  }, [ariaLabel, handleScroll, isAnimating, keyboard.onKeyDown, orientation, wheel.onWheel]);

  const getItemProps = useCallback(
    (itemIndex: number) => {
      const virtual = virtualizer.virtualItems.find(v => v.index === itemIndex);
      const isActive = index === itemIndex;

      return {
        ref: (virtual ? virtual.measureElement : undefined) as React.RefCallback<HTMLElement>,
        "data-index": itemIndex,
        "data-active": isActive,
        style: {
          position: "absolute" as const,
          top: 0,
          left: 0,
          transform: orientation === 'vertical'
            ? `translateY(${virtual ? virtual.offset : 0}px)`
            : `translateX(${virtual ? virtual.offset : 0}px)`,
          height: orientation === 'vertical' ? (virtual ? virtual.size : undefined) : '100%',
          width: orientation === 'horizontal' ? (virtual ? virtual.size : undefined) : '100%',
          willChange: "transform",
          contain: "layout paint",
          // Native Snap Item Styles
          scrollSnapAlign: "start",
          scrollSnapStop: "always" as any,
        },
      };
    },
    [index, virtualizer.virtualItems, orientation],
  );

  const api: SwipeDeckAPI<T> = {
    ...apiState,
    prev: () => navigateTo(index - 1, "user:keyboard"),
    next: () => navigateTo(index + 1, "user:keyboard"),
    scrollTo: (target, opts) => navigateTo(target, "programmatic", opts?.behavior),
    getViewportProps,
    getItemProps,
    virtualItems: virtualizer.virtualItems,
    totalSize: virtualizer.totalSize,
    items,
  };

  return api;
}
