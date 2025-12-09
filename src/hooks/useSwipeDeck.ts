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
    threshold: 100,
    debounce: 120,
    cooldown: 800,
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

  const gestureCfg = useMemo(() => ({ ...DEFAULTS.gesture, ...(options.gesture ?? {}) }), [options.gesture]);
  const wheelCfg = useMemo(() => ({ ...DEFAULTS.wheel, ...(options.wheel ?? {}) }), [options.wheel]);
  const keyboardCfg = useMemo(() => ({ ...DEFAULTS.keyboard, ...(options.keyboard ?? {}) }), [options.keyboard]);
  const virtualCfg = useMemo(() => ({ ...DEFAULTS.virtual, ...(options.virtual ?? {}) }), [options.virtual]);
  const endReachedThreshold = options.endReachedThreshold ?? DEFAULTS.endReachedThreshold;
  const ariaLabel = options.ariaLabel ?? DEFAULTS.ariaLabel;
  const keyboardNavigation = options.keyboardNavigation ?? true;

  const isControlled = typeof options.index === "number";
  const [internalIndex, setInternalIndex] = useState(() => clamp(defaultIndex, 0, Math.max(items.length - 1, 0)));
  const index = isControlled ? clamp(options.index ?? 0, 0, Math.max(items.length - 1, 0)) : internalIndex;

  const [isAnimating, setIsAnimating] = useState(false);

  // Use state for viewport to ensure hooks like useVirtualizer/useWheel know when it's ready
  const [viewport, setViewport] = useState<HTMLElement | null>(null);

  const sourceRef = useRef<IndexChangeSource>("snap");
  const dragStartScrollRef = useRef<number>(0);
  const isNavigatingRef = useRef(false); // Track programmatic navigation to prevent scroll handler interference

  useEffect(() => {
    // Clamp index when items change
    const clamped = clamp(index, 0, Math.max(items.length - 1, 0));
    if (!isControlled) setInternalIndex(clamped);
  }, [index, isControlled, items.length]);

  const virtualizer = useVirtualizer({
    items,
    virtual: virtualCfg,
    getScrollElement: useCallback(() => viewport, [viewport]),
    orientation,
  });

  // Stabilize callbacks using a ref for latest state
  const latest = useRef({
    index,
    items,
    isControlled,
    options,
    virtualizer,
    loop,
    orientation,
    setInternalIndex,
    setIsAnimating,
    viewport, // Add viewport to latest ref
  });

  // Update ref on every render
  latest.current = {
    index,
    items,
    isControlled,
    options,
    virtualizer,
    loop,
    orientation,
    setInternalIndex,
    setIsAnimating,
    viewport,
  };

  const applyIndexChange = useCallback(
    (nextIndex: number) => {
      const { index, isControlled, options, setInternalIndex, setIsAnimating } = latest.current;
      if (nextIndex === index) return;
      if (!isControlled) setInternalIndex(nextIndex);
      options.onIndexChange?.(nextIndex, sourceRef.current ?? "snap");
      setIsAnimating(false);
      sourceRef.current = "snap";
    },
    []
  );


  const navigateTo = useCallback(
    (targetIndex: number, source: IndexChangeSource, behavior?: ScrollBehavior) => {
      const { items, loop, index, isControlled, options, orientation, virtualizer, setInternalIndex, viewport } = latest.current;

      if (items.length === 0) return;
      const maxIndex = items.length - 1;
      let next = targetIndex;
      if (loop) {
        next = (next + items.length) % items.length;
      } else {
        next = clamp(next, 0, maxIndex);
      }

      // Don't navigate to same index
      if (next === index) return;

      sourceRef.current = source;

      // Mark as navigating to prevent handleScroll from interfering
      isNavigatingRef.current = true;

      // Update index immediately
      if (!isControlled) setInternalIndex(next);
      options.onIndexChange?.(next, source);

      if (!viewport) return;

      // CRITICAL: Temporarily disable scroll-snap during programmatic navigation
      // This prevents CSS from fighting with our scroll position, while allowing
      // use to use smooth scrolling
      const originalSnapType = viewport.style.scrollSnapType;
      viewport.style.scrollSnapType = 'none';
      viewport.style.scrollBehavior = 'auto'; // Let virtualizer handle behavior

      const targetBehavior = behavior ?? (prefersReducedMotion() ? "instant" : "smooth");

      // Manual scroll calculation to bypass virtualizer's dynamic size check which warns on smooth scroll
      const targetScroll = next * virtualizer.containerSize;

      if (orientation === 'vertical') {
        viewport.scrollTo({ top: targetScroll, behavior: targetBehavior });
      } else {
        viewport.scrollTo({ left: targetScroll, behavior: targetBehavior });
      }

      // Re-enable scroll-snap after animation completes to lock it in
      // 600ms is usually enough for smooth scroll to finish
      setTimeout(() => {
        isNavigatingRef.current = false;
        viewport.style.scrollSnapType = originalSnapType || (orientation === 'vertical' ? 'y mandatory' : 'x mandatory');

        // Ensure we are perfectly snapped if the animation didn't land exactly 
        // (though virtualizer usually nails it)
      }, targetBehavior === 'smooth' ? 600 : 50);
    },
    []
  );

  const wheel = useWheel({
    orientation,
    direction,
    discretePaging: wheelCfg.discretePaging ?? true,
    threshold: wheelCfg.threshold ?? 80,
    debounce: wheelCfg.debounce ?? 120,
    cooldown: wheelCfg.cooldown ?? 400,
    onRequestIndexChange: delta => navigateTo(latest.current.index + delta, "user:wheel"),
    viewport,
  });

  const onDragStart = useCallback(() => {
    const { viewport, orientation } = latest.current;
    if (viewport) {
      // Optimization: Force auto behavior immediately on drag start
      viewport.style.scrollBehavior = 'auto';
      dragStartScrollRef.current = orientation === "vertical" ? viewport.scrollTop : viewport.scrollLeft;
    }
  }, []);

  const onDrag = useCallback((delta: number) => {
    const { viewport, orientation } = latest.current;
    if (viewport) {
      const newScroll = dragStartScrollRef.current - delta;
      if (orientation === "vertical") {
        viewport.scrollTop = newScroll;
      } else {
        viewport.scrollLeft = newScroll;
      }
      // Force immediate scroll handling for smooth drag
      // Note: setting scrollTop fires 'scroll' event asynchronously generally, but
      // some browsers might fire it fast. We rely on the event listener.
    }
  }, []);

  const gestures = useGestures({
    orientation,
    direction,
    threshold: gestureCfg.threshold ?? 50,
    flickVelocity: gestureCfg.flickVelocity ?? 0.5,
    lockAxis: gestureCfg.lockAxis ?? true,
    ignoreWhileAnimating: gestureCfg.ignoreWhileAnimating ?? true,
    loop,
    getIndex: () => latest.current.index,
    maxIndex: Math.max(items.length - 1, 0),
    onRequestIndexChange: next => navigateTo(next, "user:gesture"),
    setAnimating: setIsAnimating,
    isAnimating,
    onDragStart,
    onDrag,
  });

  const keyboard = useKeyboard({
    orientation,
    direction,
    config: keyboardNavigation ? keyboardCfg : { enabled: false },
    onPrev: () => navigateTo(latest.current.index - 1, "user:keyboard"),
    onNext: () => navigateTo(latest.current.index + 1, "user:keyboard"),
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
    // Skip scroll-based index calculation during programmatic navigation
    if (isNavigatingRef.current) return;

    if (rafId.current !== null) return;

    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;

      // Double-check we're not navigating
      if (isNavigatingRef.current) return;

      const { viewport, orientation, virtualizer } = latest.current;
      if (!viewport) return;

      const scrollOffset = orientation === "vertical" ? viewport.scrollTop : viewport.scrollLeft;
      const viewportSize = orientation === "vertical" ? viewport.clientHeight : viewport.clientWidth;

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
  }, [applyIndexChange]); // applyIndexChange is stable now

  useEffect(() => {
    const viewport = latest.current.viewport;
    if (!viewport) return;
    // We attach scroll listener in virtualizer for ITs purposes.
    // But we also need one for updating SwipeDeck State (index).
    // And to support `wheel` which we attach to props.
    // Virtualizer attaches its own listener for rendering.
    // We validly can have multiple listeners.
  }, [viewport]); // Depend on viewport

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

  // Re-enable scroll-snap when user touches the screen
  const handleTouchStart = useCallback(() => {
    const { viewport, orientation } = latest.current;
    if (viewport) {
      viewport.style.scrollSnapType = orientation === 'vertical' ? 'y mandatory' : 'x mandatory';
    }
  }, []);

  const getViewportProps = useCallback(() => {
    const virtualStyles: React.CSSProperties = {
      position: "relative",
      overflow: "auto",
      // Native Scroll Snap - handles touch swipe automatically
      scrollSnapType: orientation === "vertical" ? "y mandatory" : "x mandatory",
      // Allow native touch scrolling - this works with scroll-snap for smooth swipe experience
      touchAction: orientation === "vertical" ? "pan-y" : "pan-x",
      willChange: "scroll-position",
    };

    return {
      ref: setViewport,
      role: "feed",
      "aria-label": ariaLabel,
      "aria-busy": isAnimating,
      tabIndex: 0,
      onScroll: handleScroll,
      // onWheel: wheel.onWheel, // REMOVED: Managed internally by useWheel
      onKeyDown: keyboard.onKeyDown,
      onTouchStart: handleTouchStart,
      ...gestures.handlers,
      style: virtualStyles,
    } satisfies React.HTMLAttributes<HTMLElement> & { ref: React.RefCallback<HTMLElement> };
  }, [ariaLabel, handleScroll, handleTouchStart, isAnimating, keyboard.onKeyDown, orientation, gestures.handlers]);

  const getItemProps = useCallback(
    (itemIndex: number) => {
      const { index, virtualizer, orientation } = latest.current;
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
    [],
  );

  const prev = useCallback(() => navigateTo(latest.current.index - 1, "user:keyboard"), [navigateTo]);
  const next = useCallback(() => navigateTo(latest.current.index + 1, "user:keyboard"), [navigateTo]);

  const api: SwipeDeckAPI<T> = useMemo(() => ({
    ...apiState,
    prev,
    next,
    scrollTo: (target, opts) => navigateTo(target, "programmatic", opts?.behavior),
    getViewportProps,
    getItemProps,
    virtualItems: virtualizer.virtualItems,
    totalSize: virtualizer.totalSize,
    items,
    orientation,
  }), [apiState, prev, next, navigateTo, getViewportProps, getItemProps, virtualizer.virtualItems, virtualizer.totalSize, items, orientation]);

  return api;
}
