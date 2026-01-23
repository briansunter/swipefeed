import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
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
  const preload = options.preload ?? 0;
  const preloadPrevious = options.preloadPrevious ?? 0;

  const gestureCfg = useMemo(() => ({ ...DEFAULTS.gesture, ...(options.gesture ?? {}) }), [options.gesture]);
  const wheelCfg = useMemo(() => ({ ...DEFAULTS.wheel, ...(options.wheel ?? {}) }), [options.wheel]);
  const keyboardCfg = useMemo(() => ({ ...DEFAULTS.keyboard, ...(options.keyboard ?? {}) }), [options.keyboard]);
  const virtualCfg = useMemo(() => {
    const base = { ...DEFAULTS.virtual, ...(options.virtual ?? {}) };
    // Ensure overscan is at least as large as preload + preloadPrevious to ensure all preloaded items are rendered
    const minOverscan = Math.max(preload, preloadPrevious);
    return {
      ...base,
      overscan: Math.max(base.overscan ?? 0, minOverscan),
    };
  }, [options.virtual, preload, preloadPrevious]);
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
  const snapRestoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // Track snap restore timeout
  const navigationStartRef = useRef<number>(0); // Track when navigation started for safety timeout
  const lastNavigationIndexRef = useRef<number>(-1); // Prevent duplicate navigations to same index
  const lastNavigationTimeRef = useRef<number>(0); // Cooldown between navigations

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

      // Don't navigate to same index unless it's a snap/correction
      if (next === index && source !== "snap") return;

      const now = Date.now();

      // Block ALL navigation while one is in progress (except snap corrections)
      if (isNavigatingRef.current && source !== "snap") {
        return;
      }

      // Minimum cooldown between ANY navigations (prevents multi-swipe)
      const MIN_NAVIGATION_COOLDOWN = 250;
      if (now - lastNavigationTimeRef.current < MIN_NAVIGATION_COOLDOWN && source !== "snap") {
        return;
      }

      lastNavigationIndexRef.current = next;
      lastNavigationTimeRef.current = now;

      sourceRef.current = source;

      // Mark as navigating to prevent handleScroll from interfering
      isNavigatingRef.current = true;

      // Update index immediately
      if (!isControlled) setInternalIndex(next);
      options.onIndexChange?.(next, source);

      if (!viewport) return;

      // Clear any pending snap restore timeout
      if (snapRestoreTimeoutRef.current) {
        clearTimeout(snapRestoreTimeoutRef.current);
        snapRestoreTimeoutRef.current = null;
      }

      // CRITICAL: Temporarily disable scroll-snap during programmatic navigation
      // This prevents CSS from fighting with our scroll position
      viewport.style.scrollSnapType = 'none';
      viewport.style.scrollBehavior = 'auto';

      const targetBehavior = behavior ?? (prefersReducedMotion() ? "instant" : "smooth");

      // Manual scroll calculation
      const targetScroll = next * virtualizer.containerSize;

      // Track navigation start time for safety timeout
      navigationStartRef.current = Date.now();

      if (orientation === 'vertical') {
        viewport.scrollTo({ top: targetScroll, behavior: targetBehavior });
      } else {
        viewport.scrollTo({ left: targetScroll, behavior: targetBehavior });
      }

      // Handler to restore scroll-snap after navigation completes
      const handleScrollEnd = () => {
        isNavigatingRef.current = false;
        if (snapRestoreTimeoutRef.current) {
          clearTimeout(snapRestoreTimeoutRef.current);
          snapRestoreTimeoutRef.current = null;
        }
        if (viewport) {
          viewport.style.scrollSnapType = orientation === 'vertical' ? 'y mandatory' : 'x mandatory';
        }
      };

      // Use scrollend event if available (modern browsers), with fallback timeout
      if ('onscrollend' in window) {
        const scrollEndHandler = () => {
          handleScrollEnd();
          viewport.removeEventListener('scrollend', scrollEndHandler);
        };
        viewport.addEventListener('scrollend', scrollEndHandler, { once: true });
        // Safety fallback in case scrollend never fires
        snapRestoreTimeoutRef.current = setTimeout(() => {
          viewport.removeEventListener('scrollend', scrollEndHandler);
          handleScrollEnd();
        }, 800);
      } else {
        // Fallback for browsers without scrollend support
        const restoreDelay = targetBehavior === 'smooth' ? 500 : 50;
        snapRestoreTimeoutRef.current = setTimeout(handleScrollEnd, restoreDelay);
      }
    },
    []
  );

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
    }
  }, []);

  // Calculate target index from current scroll position (for snap correction)
  const getSnapTargetIndex = useCallback(() => {
    const { viewport, orientation, items, virtualizer } = latest.current;
    if (!viewport || items.length === 0) return latest.current.index;

    const scrollOffset = orientation === "vertical" ? viewport.scrollTop : viewport.scrollLeft;
    const itemSize = virtualizer.containerSize || viewport.clientHeight;

    if (itemSize <= 0) return latest.current.index;

    const targetIndex = Math.round(scrollOffset / itemSize);
    return clamp(targetIndex, 0, items.length - 1);
  }, []);

  const wheel = useWheel({
    orientation,
    direction,
    discretePaging: wheelCfg.discretePaging ?? true,
    threshold: wheelCfg.threshold ?? 80,
    debounce: wheelCfg.debounce ?? 120,
    cooldown: wheelCfg.cooldown ?? 400,
    onRequestIndexChange: delta => navigateTo(latest.current.index + delta, "user:wheel"),
    viewport,
    onDragStart,
    onDrag,
    onDragEnd: () => {
      // Calculate correct target from scroll position, not from state
      const targetIndex = getSnapTargetIndex();
      navigateTo(targetIndex, "snap");
    },
  });

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
  const rafId = useRef<number | null>(null);
  const scrollEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = useCallback(() => {
    // Safety: Force unlock if navigation has been stuck for too long (1.5 seconds)
    if (isNavigatingRef.current && Date.now() - navigationStartRef.current > 1500) {
      isNavigatingRef.current = false;
      console.warn('[SwipeDeck] Navigation lock timeout - forcing unlock');
    }

    // Skip scroll-based index calculation during programmatic navigation
    if (isNavigatingRef.current) return;

    // Safety Snap: If scrolling stops and we are misaligned, snap to current index
    if (scrollEndTimeoutRef.current) clearTimeout(scrollEndTimeoutRef.current);
    scrollEndTimeoutRef.current = setTimeout(() => {
      if (isNavigatingRef.current) return;
      const { viewport, orientation, index } = latest.current;
      if (!viewport) return;

      const scrollOffset = orientation === "vertical" ? viewport.scrollTop : viewport.scrollLeft;
      const computedSize = orientation === "vertical" ? viewport.clientHeight : viewport.clientWidth;
      const idealOffset = index * computedSize;

      // Use device pixel ratio for tolerance to handle high-DPI displays
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
      const tolerance = Math.max(5, Math.ceil(5 * dpr));
      if (Math.abs(scrollOffset - idealOffset) > tolerance) {
        // We are stuck between frames. Snap to the current detected index.
        viewport.scrollTo({
          top: orientation === "vertical" ? idealOffset : 0,
          left: orientation === "horizontal" ? idealOffset : 0,
          behavior: 'smooth'
        });
      }
    }, 150); // 150ms debounce for "scroll end"

    if (rafId.current !== null) return;

    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;

      // Double-check we're not navigating
      if (isNavigatingRef.current) return;

      const { viewport, orientation, items } = latest.current;
      if (!viewport) return;

      const scrollOffset = orientation === "vertical" ? viewport.scrollTop : viewport.scrollLeft;
      const viewportSize = orientation === "vertical" ? viewport.clientHeight : viewport.clientWidth;

      // Simple geometric calculation - works with CSS viewport units
      // Each item is 100dvh tall, so index = scrollOffset / viewportSize
      if (viewportSize > 0 && items.length > 0) {
        const estimatedIndex = Math.round(scrollOffset / viewportSize);
        const newIndex = clamp(estimatedIndex, 0, items.length - 1);
        applyIndexChange(newIndex);
      }
    });
  }, [applyIndexChange]); // applyIndexChange is stable now

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

  // ═══════════════════════════════════════════════════════════════════════════
  // RESIZE HANDLING: Scroll Position Correction
  // ═══════════════════════════════════════════════════════════════════════════
  // CSS viewport units handle item sizing automatically.
  // But scroll position (in pixels) becomes invalid on resize.
  // We use the current index state to correct scroll position after resize settles.
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!viewport) return;

    const handleResize = () => {
      // Clear any pending correction
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      // After resize settles, snap scroll to current index
      resizeTimeoutRef.current = setTimeout(() => {
        const { orientation, index: currentIndex } = latest.current;
        if (!viewport) return;

        const size = orientation === 'vertical' ? viewport.clientHeight : viewport.clientWidth;
        const targetScroll = currentIndex * size;

        // Only correct if significantly off (avoid fighting with scroll-snap)
        const currentScroll = orientation === 'vertical' ? viewport.scrollTop : viewport.scrollLeft;
        if (Math.abs(currentScroll - targetScroll) > size * 0.1) {
          if (orientation === 'vertical') {
            viewport.scrollTop = targetScroll;
          } else {
            viewport.scrollLeft = targetScroll;
          }
        }
      }, 50);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(viewport);

    return () => {
      resizeObserver.disconnect();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [viewport]);

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
      const isActive = index === itemIndex;

      // Use CSS viewport units for positioning - these automatically update on rotation!
      // This is much simpler and more reliable than trying to correct pixel offsets.
      const sizeUnit = orientation === 'vertical' ? '100dvh' : '100dvw';

      return {
        ref: undefined,
        "data-index": itemIndex,
        "data-active": isActive,
        style: {
          position: "absolute" as const,
          top: 0,
          left: 0,
          // Use CSS calc with viewport units - browser handles rotation automatically!
          transform: orientation === 'vertical'
            ? `translateY(calc(${itemIndex} * ${sizeUnit}))`
            : `translateX(calc(${itemIndex} * ${sizeUnit}))`,
          height: orientation === 'vertical' ? sizeUnit : '100%',
          width: orientation === 'horizontal' ? sizeUnit : '100%',
          willChange: "transform",
          // Native Snap Item Styles
          scrollSnapAlign: "start",
          scrollSnapStop: "always" satisfies React.CSSProperties["scrollSnapStop"],
        } satisfies React.CSSProperties,
      };
    },
    [index, orientation],
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
    viewport,
  }), [apiState, prev, next, navigateTo, getViewportProps, getItemProps, virtualizer.virtualItems, virtualizer.totalSize, items, orientation, viewport]);

  return api;
}
