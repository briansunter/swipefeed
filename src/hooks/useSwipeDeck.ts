import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { clamp } from "../utils/clamp";
import { prefersReducedMotion } from "../utils/prefersReducedMotion";
import { calculateSwipeDeckMotion, createInitialSwipeDeckMotion } from "../motion";
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
import {
  NAVIGATION_COOLDOWN_MS,
  SCROLLEND_FALLBACK_TIMEOUT_MS,
  STUCK_NAVIGATION_TIMEOUT_MS,
  NAVIGATION_LOCK_TIMEOUT_MS,
  SNAP_CORRECTION_DEBOUNCE_MS,
  RESIZE_CORRECTION_DEBOUNCE_MS,
  SNAP_ALIGNMENT_TOLERANCE_PX,
  RESIZE_MISALIGNMENT_THRESHOLD,
} from "../constants";

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
  const visibilityCfg = useMemo(
    () => ({ ...DEFAULTS.visibility, ...(options.visibility ?? {}) }),
    [options.visibility],
  );
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

  const touchActiveRef = useRef(false);
  const dragActiveRef = useRef(false);
  const dragRafRef = useRef<number | null>(null);
  const pendingDragRef = useRef(0);
  const nativeIndexRef = useRef<number | null>(null);
  const alignmentRafRef = useRef<number | null>(null);
  const sourceRef = useRef<IndexChangeSource>("snap");
  const resizeSettlingUntil = useRef(0);
  const dragStartScrollRef = useRef<number>(0);
  const isNavigatingRef = useRef(false); // Track programmatic navigation to prevent scroll handler interference
  const snapRestoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // Track snap restore timeout
  const navigationStartRef = useRef<number>(0); // Track when navigation started for safety timeout
  const lastNavigationIndexRef = useRef<number>(-1); // Prevent duplicate navigations to same index
  const lastNavigationTimeRef = useRef<number>(0); // Cooldown between navigations
  const motionRef = useRef(createInitialSwipeDeckMotion(index));
  const motionRafRef = useRef<number | null>(null);
  const activeItemRef = useRef<{ item: T; index: number } | null>(null);
  const itemElementsRef = useRef(new Map<number, HTMLElement>());
  const itemRefCallbacksRef = useRef(new Map<number, React.RefCallback<HTMLElement>>());
  const visibilityObserverRef = useRef<IntersectionObserver | null>(null);
  const visibilityRatiosRef = useRef(new Map<number, number>());
  const visibilityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clamp index when items change
    const clamped = clamp(index, 0, Math.max(items.length - 1, 0));
    if (!isControlled) setInternalIndex(clamped);
  }, [index, isControlled, items.length]);

  const virtualizer = useVirtualizer({
    items,
    activeIndex: index,
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
      if (Date.now() < resizeSettlingUntil.current) return;
      if (nextIndex === index) {
        // A settled controlled navigation still needs to release gesture state.
        setIsAnimating(false);
        return;
      }
      if (!isControlled) setInternalIndex(nextIndex);
      nativeIndexRef.current = nextIndex;
      options.onIndexChange?.(nextIndex, sourceRef.current ?? "snap");
      setIsAnimating(false);
      sourceRef.current = "snap";
    },
    []
  );

  useEffect(() => {
    const hasActiveItem = index >= 0 && index < items.length;
    const nextActive = hasActiveItem ? { item: items[index] as T, index } : null;
    const previousActive = activeItemRef.current;
    const didChange = previousActive?.index !== nextActive?.index
      || previousActive?.item !== nextActive?.item;

    if (!didChange) return;
    if (previousActive) {
      latest.current.options.onItemInactive?.(previousActive.item, previousActive.index);
    }
    activeItemRef.current = nextActive;
    if (nextActive) {
      latest.current.options.onItemActive?.(nextActive.item, nextActive.index);
    }
  }, [index, items]);

  useEffect(() => () => {
    const activeItem = activeItemRef.current;
    if (activeItem) {
      latest.current.options.onItemInactive?.(activeItem.item, activeItem.index);
      activeItemRef.current = null;
    }
  }, []);

  const emitMotion = useCallback((
    force = false,
    geometry?: { orientation: Orientation; itemCount: number },
  ) => {
    const { viewport, orientation: currentOrientation, items, options } = latest.current;
    if (!viewport) return;
    const motionOrientation = geometry?.orientation ?? currentOrientation;
    const itemCount = geometry?.itemCount ?? items.length;

    const previousMotion = motionRef.current;
    const nextMotion = calculateSwipeDeckMotion({
      scrollOffset: motionOrientation === "vertical" ? viewport.scrollTop : viewport.scrollLeft,
      viewportSize: motionOrientation === "vertical" ? viewport.clientHeight : viewport.clientWidth,
      itemCount,
      previousScrollOffset: previousMotion.scrollOffset,
      settleTolerance: SNAP_ALIGNMENT_TOLERANCE_PX,
    });
    // A controlled index acknowledgment is not a new movement.
    if (force && nextMotion.scrollOffset === previousMotion.scrollOffset)
      nextMotion.direction = previousMotion.direction;
    motionRef.current = nextMotion;

    const didChange = Object.keys(nextMotion).some((key) => {
      const motionKey = key as keyof typeof nextMotion;
      return nextMotion[motionKey] !== previousMotion[motionKey];
    });
    if (force || didChange) options.onMotionChange?.(nextMotion);
  }, []);

  const scheduleMotion = useCallback(() => {
    if (motionRafRef.current !== null) return;
    motionRafRef.current = -1;
    const animationFrame = requestAnimationFrame(() => {
      motionRafRef.current = null;
      emitMotion();
    });
    // Synchronous requestAnimationFrame test doubles may run the callback
    // before returning an id. Preserve the callback's cleared state in that case.
    if (motionRafRef.current !== null) motionRafRef.current = animationFrame;
  }, [emitMotion]);

  useEffect(() => {
    if (!viewport) return;
    emitMotion(true, { orientation, itemCount: items.length });
  }, [emitMotion, index, items.length, orientation, viewport]);

  useEffect(() => () => {
    if (motionRafRef.current !== null) cancelAnimationFrame(motionRafRef.current);
  }, []);

  const getItemRef = useCallback((itemIndex: number): React.RefCallback<HTMLElement> => {
    const cached = itemRefCallbacksRef.current.get(itemIndex);
    if (cached) return cached;

    const callback: React.RefCallback<HTMLElement> = (element) => {
      const previousElement = itemElementsRef.current.get(itemIndex);
      if (previousElement && previousElement !== element) {
        visibilityObserverRef.current?.unobserve(previousElement);
      }

      if (!element) {
        itemElementsRef.current.delete(itemIndex);
        visibilityRatiosRef.current.delete(itemIndex);
        return;
      }

      itemElementsRef.current.set(itemIndex, element);
      visibilityObserverRef.current?.observe(element);
    };
    itemRefCallbacksRef.current.set(itemIndex, callback);
    return callback;
  }, []);

  useEffect(() => {
    if (
      !viewport
      || visibilityCfg.strategy !== "intersection"
      || typeof IntersectionObserver === "undefined"
    ) return;

    const intersectionRatio = clamp(visibilityCfg.intersectionRatio, 0, 1);
    const debounce = Math.max(0, visibilityCfg.debounce);

    const commitVisibleIndex = () => {
      visibilityDebounceRef.current = null;
      const currentIndex = latest.current.index;
      let nextIndex = -1;
      let nextRatio = -1;

      for (const [itemIndex, ratio] of visibilityRatiosRef.current) {
        const isBetterRatio = ratio > nextRatio;
        const isCloserTie = ratio === nextRatio
          && Math.abs(itemIndex - currentIndex) < Math.abs(nextIndex - currentIndex);
        if (ratio >= intersectionRatio && (isBetterRatio || isCloserTie)) {
          nextIndex = itemIndex;
          nextRatio = ratio;
        }
      }

      if (nextIndex < 0 || nextIndex === latest.current.index) return;
      sourceRef.current = "visibility";
      applyIndexChange(nextIndex);
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const itemIndex = Number((entry.target as HTMLElement).dataset.index);
        if (!Number.isInteger(itemIndex)) continue;
        visibilityRatiosRef.current.set(
          itemIndex,
          entry.isIntersecting ? entry.intersectionRatio : 0,
        );
      }

      if (visibilityDebounceRef.current) clearTimeout(visibilityDebounceRef.current);
      if (debounce === 0) commitVisibleIndex();
      else visibilityDebounceRef.current = setTimeout(commitVisibleIndex, debounce);
    }, {
      root: viewport,
      threshold: Array.from(new Set([0, intersectionRatio, 1])),
    });

    visibilityObserverRef.current = observer;
    for (const element of itemElementsRef.current.values()) observer.observe(element);

    return () => {
      observer.disconnect();
      if (visibilityObserverRef.current === observer) visibilityObserverRef.current = null;
      visibilityRatiosRef.current.clear();
      if (visibilityDebounceRef.current) {
        clearTimeout(visibilityDebounceRef.current);
        visibilityDebounceRef.current = null;
      }
    };
  }, [
    applyIndexChange,
    viewport,
    visibilityCfg.debounce,
    visibilityCfg.intersectionRatio,
    visibilityCfg.strategy,
  ]);


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
      if (next === index && source !== "snap" && source !== "user:gesture") return;

      const now = Date.now();

      // Safety reset: Clear stuck navigation state if it's been too long
      // This prevents isNavigatingRef from permanently blocking navigation
      if (isNavigatingRef.current && now - navigationStartRef.current > STUCK_NAVIGATION_TIMEOUT_MS) {
        if (process.env.NODE_ENV !== 'production') console.warn('[SwipeDeck] Clearing stuck navigation state');
        isNavigatingRef.current = false;
      }

      // Block ALL navigation while one is in progress (except snap corrections and programmatic)
      if (isNavigatingRef.current && source !== "snap" && source !== "programmatic" && source !== "user:gesture") {
        return;
      }

      // Minimum cooldown between ANY navigations (prevents multi-swipe)
      // Programmatic navigation bypasses cooldown since it's explicit API usage
      if (now - lastNavigationTimeRef.current < NAVIGATION_COOLDOWN_MS && source !== "snap" && source !== "programmatic" && source !== "user:gesture" && source !== "user:wheel") {
        return;
      }

      lastNavigationIndexRef.current = next;
      lastNavigationTimeRef.current = now;

      sourceRef.current = source;

      // Mark as navigating to prevent handleScroll from interfering
      isNavigatingRef.current = true;
      navigationStartRef.current = Date.now();

      // Update index immediately
      if (!isControlled) setInternalIndex(next);
      options.onIndexChange?.(next, source);

      if (!viewport) {
        if (process.env.NODE_ENV !== 'production') console.warn('[SwipeDeck] No viewport, skipping scroll');
        return;
      }

      // Clear any pending snap restore timeout
      if (snapRestoreTimeoutRef.current) {
        clearTimeout(snapRestoreTimeoutRef.current);
        snapRestoreTimeoutRef.current = null;
      }

      // Keep snap enabled throughout navigation. Re-enabling it after a virtual
      // window update can snap back to the previous item and suspend active media.
      viewport.style.scrollBehavior = 'auto';

      const baseDuration = Math.min(700, Math.max(0, options.transitionDuration ?? 0));
      const viewportSize = orientation === "vertical" ? viewport.clientHeight : viewport.clientWidth;
      const remaining = Math.abs(next * viewportSize - (orientation === "vertical" ? viewport.scrollTop : viewport.scrollLeft));
      const duration = source === "user:gesture" && baseDuration > 0
        ? Math.min(260,baseDuration, Math.max(100, baseDuration * Math.sqrt(remaining / Math.max(1, viewportSize)))) : baseDuration;
      if (alignmentRafRef.current !== null) cancelAnimationFrame(alignmentRafRef.current);
      alignmentRafRef.current = null;
      if (duration > 0 && behavior !== "instant" && !prefersReducedMotion()) {
        const from = orientation === "vertical" ? viewport.scrollTop : viewport.scrollLeft;
        const target = next * (orientation === "vertical" ? viewport.clientHeight : viewport.clientWidth);
        const started = performance.now();
        let completed = false;
        viewport.style.scrollSnapType = "none";
        latest.current.setIsAnimating(true);
        const write = (offset: number) => viewport.scrollTo(orientation === "vertical"
          ? {top:offset,behavior:"instant"} : {left:offset,behavior:"instant"});
        const finish = () => {
          if (completed || lastNavigationIndexRef.current !== next) return;
          completed = true;
          if (alignmentRafRef.current !== null) cancelAnimationFrame(alignmentRafRef.current);
          if (snapRestoreTimeoutRef.current) clearTimeout(snapRestoreTimeoutRef.current);
          snapRestoreTimeoutRef.current = null;
          write(target);
          viewport.style.scrollSnapType = latest.current.options.gesture?.touch === "controlled" ? "none" : orientation === "vertical" ? "y mandatory" : "x mandatory";
          // The deadline must release state even if WebKit defers the next rAF.
          isNavigatingRef.current = false;
          latest.current.setIsAnimating(false);
          sourceRef.current = "snap";
          emitMotion();
          alignmentRafRef.current = requestAnimationFrame(() => {
            alignmentRafRef.current = null;
            if (lastNavigationIndexRef.current === next && !dragActiveRef.current) {
              write(target);
              emitMotion();
            }
          });
        };
        const tick = (now: number) => {
          if (completed || lastNavigationIndexRef.current !== next) return;
          const progress = clamp((now - started) / duration, 0, 1);
          write(from + (target - from) * (1 - Math.pow(1 - progress, 3)));
          scheduleMotion();
          if (progress < 1) alignmentRafRef.current = requestAnimationFrame(tick);
          else finish();
        };
        alignmentRafRef.current = requestAnimationFrame(tick);
        snapRestoreTimeoutRef.current = setTimeout(finish, duration + 150);
        return;
      }

      // Use instant scroll for wheel and programmatic navigation to avoid timing issues
      // Smooth scroll can cause scrollend to fire late, keeping isNavigatingRef stuck
      // Only gestures get smooth scroll since they have visual drag feedback
      const targetBehavior = prefersReducedMotion() ? "instant" : behavior ?? (
        source === "user:wheel" || source === "programmatic" ? "instant" : "smooth"
      );

      // Manual scroll calculation
      const targetScroll = next * virtualizer.containerSize;

      // Track navigation start time for safety timeout
      navigationStartRef.current = Date.now();

      if (orientation === 'vertical') {
        viewport.scrollTo({ top: targetScroll, behavior: targetBehavior });
      } else {
        viewport.scrollTo({ left: targetScroll, behavior: targetBehavior });
      }

      // A compositor wheel snap can overwrite a synchronous scrollTo after the
      // handler returns. Verify the requested position outside that wheel task.
      if (alignmentRafRef.current !== null) cancelAnimationFrame(alignmentRafRef.current);
      alignmentRafRef.current = targetBehavior === "smooth" ? null : requestAnimationFrame(() => {
        alignmentRafRef.current = null;
        if (lastNavigationIndexRef.current !== next) return;
        const size = orientation === "vertical" ? viewport.clientHeight : viewport.clientWidth;
        const offset = orientation === "vertical" ? viewport.scrollTop : viewport.scrollLeft;
        if (Math.abs(offset - next * size) > 1) {
          viewport.scrollTo(orientation === "vertical"
            ? {top:next * size,behavior:"instant"} : {left:next * size,behavior:"instant"});
        }
      });

      // Handler to restore scroll-snap after navigation completes
      const handleScrollEnd = () => {
        isNavigatingRef.current = false;
        latest.current.setIsAnimating(false);
        if (snapRestoreTimeoutRef.current) {
          clearTimeout(snapRestoreTimeoutRef.current);
          snapRestoreTimeoutRef.current = null;
        }
        if (viewport) {
          viewport.style.scrollSnapType = latest.current.options.gesture?.touch === 'controlled' ? 'none' : orientation === 'vertical' ? 'y mandatory' : 'x mandatory';
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
        }, SCROLLEND_FALLBACK_TIMEOUT_MS);
      } else {
        // Fallback for browsers without scrollend support
        const restoreDelay = targetBehavior === 'smooth' ? 500 : 50;
        snapRestoreTimeoutRef.current = setTimeout(handleScrollEnd, restoreDelay);
      }
    },
    []
  );

  // Controlled indexes can change through routing, deep links or list updates,
  // without navigateTo(). Align before scroll observers can publish the old index.
  useLayoutEffect(() => {
    if (!viewport || !isControlled) return;
    // A controlled acknowledgment of native scrolling is not an external jump.
    // Let the finger continue moving the viewport until native snap settles it.
    if (nativeIndexRef.current === index) { nativeIndexRef.current = null; return; }
    if (dragActiveRef.current || (isNavigatingRef.current && lastNavigationIndexRef.current === index)) return;
    const size = orientation === "vertical" ? viewport.clientHeight : viewport.clientWidth;
    if (size <= 0) return;
    const target = index * size;
    const current = orientation === "vertical" ? viewport.scrollTop : viewport.scrollLeft;
    if (Math.abs(current - target) < 1) return;
    isNavigatingRef.current = true;
    navigationStartRef.current = Date.now();
    sourceRef.current = "programmatic";
    // Keep snap enabled: toggling it can reselect the previously snapped slide
    // after virtualization removes an earlier item, leaving active media offscreen.
    const align = () => {
      const offset = latest.current.index * (orientation === "vertical" ? viewport.clientHeight : viewport.clientWidth);
      viewport.scrollTo(orientation === "vertical" ? {top: offset, behavior:"instant"} : {left: offset, behavior:"instant"});
    };
    align();
    const frame = requestAnimationFrame(() => {
      align();
      isNavigatingRef.current = false;
      sourceRef.current = "snap";
    });
    return () => {
      cancelAnimationFrame(frame);
      isNavigatingRef.current = false;
    };
  }, [index, isControlled, orientation, viewport, virtualizer.containerSize]);

  const onDragStart = useCallback(() => {
    const { viewport, orientation } = latest.current;
    if (!viewport) return;
    if (alignmentRafRef.current !== null) cancelAnimationFrame(alignmentRafRef.current);
    alignmentRafRef.current = null;
    if (snapRestoreTimeoutRef.current) clearTimeout(snapRestoreTimeoutRef.current);
    snapRestoreTimeoutRef.current = null;
    isNavigatingRef.current = false;
    dragActiveRef.current = true;
    viewport.style.scrollBehavior = 'auto';
    viewport.style.scrollSnapType = 'none';
    dragStartScrollRef.current = orientation === "vertical" ? viewport.scrollTop : viewport.scrollLeft;
  }, []);

  const writePendingDrag=useCallback(()=>{
    const {viewport,orientation,index,items}=latest.current;
    if(!viewport)return;
    const size=orientation==="vertical"?viewport.clientHeight:viewport.clientWidth;
    const offset=clamp(dragStartScrollRef.current-pendingDragRef.current,
      Math.max(0,(index-1)*size),Math.min((items.length-1)*size,(index+1)*size));
    if(orientation==="vertical")viewport.scrollTop=offset;
    else viewport.scrollLeft=offset;
    scheduleMotion();
  },[scheduleMotion]);
  const onDrag = useCallback((delta: number) => {
    pendingDragRef.current = delta;
    if (dragRafRef.current !== null) return;
    dragRafRef.current = requestAnimationFrame(() => {
      dragRafRef.current = null;
      writePendingDrag();
    });
  }, [writePendingDrag]);

  const onDragEnd = useCallback(() => {
    // Apply the final input sample before release physics takes ownership.
    if(dragActiveRef.current&&dragRafRef.current!==null)writePendingDrag();
    if (dragRafRef.current !== null) cancelAnimationFrame(dragRafRef.current);
    dragRafRef.current = null;
    dragActiveRef.current = false;
  }, [writePendingDrag]);

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
    enabled: gestureCfg.enabled,
    canStart: () => !gestures.hasPointer(),
    threshold: wheelCfg.threshold ?? 80,
    debounce: wheelCfg.debounce ?? 120,
    cooldown: wheelCfg.cooldown ?? 400,
    onRequestIndexChange: delta => {
      onDragEnd();
      const p = latest.current;
      const target = p.loop ? p.index + delta : clamp(p.index + delta, 0, p.items.length - 1);
      navigateTo(target, target === p.index ? "snap" : "user:wheel");
    },
    viewport: options.inputTarget ?? viewport,
    onDragStart,
    onDrag,
    onDragEnd: () => {
      onDragEnd();
      // Calculate correct target from scroll position, not from state
      const targetIndex = latest.current.options.gesture?.touch === "controlled" ? latest.current.index : getSnapTargetIndex();
      navigateTo(targetIndex, "snap");
    },
  });

  const gestures = useGestures({
    enabled:gestureCfg.enabled,
    inputTarget: options.inputTarget,
    dragFromControls: gestureCfg.dragFromControls,
    orientation,
    direction,
    threshold: gestureCfg.threshold ?? 50,
    flickVelocity: gestureCfg.flickVelocity ?? 0.5,
    minFlickDistance: gestureCfg.minFlickDistance,
    distanceRatio: gestureCfg.distanceRatio,
    maxThreshold: gestureCfg.maxThreshold,
    controlledTouch: gestureCfg.touch === "controlled",
    viewportSize: () => latest.current.viewport ? (latest.current.orientation === "vertical" ? latest.current.viewport.clientHeight : latest.current.viewport.clientWidth) : 0,
    lockAxis: gestureCfg.lockAxis ?? true,
    ignoreWhileAnimating: gestureCfg.ignoreWhileAnimating ?? true,
    loop,
    getIndex: () => latest.current.index,
    maxIndex: Math.max(items.length - 1, 0),
    onRequestIndexChange: next => navigateTo(next, "user:gesture"),
    setAnimating: setIsAnimating,
    isAnimating,
    onDragStart: () => { wheel.cancel(); onDragStart(); },
    onDrag,
    onDragEnd,
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
    scheduleMotion();

    // Safety: Force unlock if navigation has been stuck for too long
    if (isNavigatingRef.current && Date.now() - navigationStartRef.current > NAVIGATION_LOCK_TIMEOUT_MS) {
      isNavigatingRef.current = false;
      if (process.env.NODE_ENV !== 'production') console.warn('[SwipeDeck] Navigation lock timeout - forcing unlock');
    }

    // Controlled input owns selection. A late compositor scroll is drift,
    // never permission to select an unrendered neighbor or start native easing.
    if (latest.current.options.gesture?.touch === "controlled") {
      if (!isNavigatingRef.current && !dragActiveRef.current && !gestures.hasPointer()) {
        const {viewport,orientation,index}=latest.current;
        if (viewport) {
          const size=orientation==="vertical"?viewport.clientHeight:viewport.clientWidth;
          const current=orientation==="vertical"?viewport.scrollTop:viewport.scrollLeft;
          if (Math.abs(current-index*size)>1) {
            viewport.scrollTo(orientation==="vertical"?{top:index*size,behavior:"instant"}:{left:index*size,behavior:"instant"});
            latest.current.setIsAnimating(false);
          }
        }
      }
      return;
    }
    // Skip scroll-based index calculation during programmatic navigation
    if (isNavigatingRef.current || dragActiveRef.current) return;

    // Safety Snap: If scrolling stops and we are misaligned, snap to current index
    if (scrollEndTimeoutRef.current) clearTimeout(scrollEndTimeoutRef.current);
    scrollEndTimeoutRef.current = setTimeout(() => {
      if (isNavigatingRef.current || touchActiveRef.current || dragActiveRef.current) return;
      const { viewport, orientation, index } = latest.current;
      if (!viewport) return;

      const scrollOffset = orientation === "vertical" ? viewport.scrollTop : viewport.scrollLeft;
      const computedSize = orientation === "vertical" ? viewport.clientHeight : viewport.clientWidth;
      const idealOffset = index * computedSize;

      // Use device pixel ratio for tolerance to handle high-DPI displays
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
      const tolerance = Math.max(SNAP_ALIGNMENT_TOLERANCE_PX, Math.ceil(SNAP_ALIGNMENT_TOLERANCE_PX * dpr));
      if (Math.abs(scrollOffset - idealOffset) > tolerance) {
        // We are stuck between frames. Snap to the current detected index.
        viewport.scrollTo({
          top: orientation === "vertical" ? idealOffset : 0,
          left: orientation === "horizontal" ? idealOffset : 0,
          behavior: 'smooth'
        });
      }
    }, SNAP_CORRECTION_DEBOUNCE_MS);

    if (rafId.current !== null) return;

    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;

      // Double-check we're not navigating
      if (isNavigatingRef.current || dragActiveRef.current) return;

      const { viewport, orientation, items, options } = latest.current;
      if (!viewport) return;

      const intersectionVisibilityAvailable = options.visibility?.strategy === "intersection"
        && typeof IntersectionObserver !== "undefined";
      if (intersectionVisibilityAvailable) return;

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
  }, [applyIndexChange, scheduleMotion, gestures.hasPointer]);

  useEffect(() => () => {
    if (scrollEndTimeoutRef.current) clearTimeout(scrollEndTimeoutRef.current);
    if (snapRestoreTimeoutRef.current) clearTimeout(snapRestoreTimeoutRef.current);
    if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    if (dragRafRef.current !== null) cancelAnimationFrame(dragRafRef.current);
    if (alignmentRafRef.current !== null) cancelAnimationFrame(alignmentRafRef.current);
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

    let previousWidth=viewport.clientWidth, previousHeight=viewport.clientHeight;
    const handleResize = () => {
      const width=viewport.clientWidth,height=viewport.clientHeight;
      const oldWidth=previousWidth,oldHeight=previousHeight;
      if(width===oldWidth&&height===oldHeight){
        const size=latest.current.orientation==="vertical"?height:width;
        const offset=latest.current.orientation==="vertical"?viewport.scrollTop:viewport.scrollLeft;
        if(gestures.hasPointer()||isNavigatingRef.current||Math.abs(offset-latest.current.index*size)<1)return;
      }
      previousWidth=width;previousHeight=height;
      // Safari's browser toolbar changes height during an ongoing touch.
      // Rebase its anchor without discarding the finger or synthesizing release.
      if(latest.current.options.gesture?.touch==="controlled"&&width===oldWidth&&gestures.hasPointer()){
        if(dragActiveRef.current){
          if(latest.current.orientation==="vertical"&&oldHeight>0)dragStartScrollRef.current*=height/oldHeight;
          writePendingDrag();
        }else{
          if(latest.current.orientation==="vertical")viewport.scrollTop=latest.current.index*height;
          else viewport.scrollLeft=latest.current.index*width;
        }
        scheduleMotion();return;
      }
      gestures.reset();
      // Rotation settles an in-flight transition at the selected slide's new size.
      if (alignmentRafRef.current !== null) cancelAnimationFrame(alignmentRafRef.current);
      alignmentRafRef.current = null;
      if (snapRestoreTimeoutRef.current) clearTimeout(snapRestoreTimeoutRef.current);
      snapRestoreTimeoutRef.current = null;
      isNavigatingRef.current = false;
      latest.current.setIsAnimating(false);
      viewport.style.scrollSnapType = latest.current.options.gesture?.touch === "controlled" ? "none" : latest.current.orientation === "vertical" ? "y mandatory" : "x mandatory";
      resizeSettlingUntil.current = Date.now() + 500;
      // Browser scroll-snap may move the viewport before the resize debounce.
      // Fence those scroll callbacks so rotation cannot replace a controlled URL.
      const current = latest.current;
      const size = current.orientation === "vertical" ? viewport.clientHeight : viewport.clientWidth;
      const offset = current.orientation === "vertical" ? viewport.scrollTop : viewport.scrollLeft;
      if (Math.abs(offset - current.index * size) < 1) { scheduleMotion(); return; }
      isNavigatingRef.current = true;
      navigationStartRef.current = Date.now();
      sourceRef.current = "programmatic";
      if (current.orientation === "vertical") viewport.scrollTop = current.index * size;
      else viewport.scrollLeft = current.index * size;
      scheduleMotion();

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
        if (Math.abs(currentScroll - targetScroll) > (latest.current.options.gesture?.touch === "controlled" ? 1 : size * RESIZE_MISALIGNMENT_THRESHOLD)) {
          if (orientation === 'vertical') {
            viewport.scrollTop = targetScroll;
          } else {
            viewport.scrollLeft = targetScroll;
          }
        }
        isNavigatingRef.current = false;
        sourceRef.current = "snap";
        emitMotion();
      }, RESIZE_CORRECTION_DEBOUNCE_MS);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(viewport);
    window.addEventListener("resize", handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [emitMotion, scheduleMotion, viewport, gestures.reset, gestures.hasPointer, writePendingDrag]);

  // Re-enable scroll-snap when user touches the screen
  const handleTouchStart = useCallback(() => {
    touchActiveRef.current = true;
    const { viewport, orientation } = latest.current;
    if (viewport) {
      // DOM updates during a native drag can make the browser re-snap early.
      viewport.style.scrollSnapType = 'none';
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchActiveRef.current = false;
    const { viewport, orientation } = latest.current;
    if (viewport) viewport.style.scrollSnapType = latest.current.options.gesture?.touch === 'controlled' ? 'none' : orientation === 'vertical' ? 'y mandatory' : 'x mandatory';
  }, []);

  const getViewportProps = useCallback(() => {
    const virtualStyles: React.CSSProperties = {
      position: "relative",
      overflow: gestureCfg.touch === "controlled" ? "hidden" : "auto",
      overflowAnchor: "none",
      overscrollBehavior: "none",
      // Native Scroll Snap - handles touch swipe automatically
      scrollSnapType: gestureCfg.touch === "controlled" ? "none" : orientation === "vertical" ? "y mandatory" : "x mandatory",
      // Allow native touch scrolling - this works with scroll-snap for smooth swipe experience
      touchAction: gestureCfg.touch === "controlled"
        ? (orientation === "vertical" ? "pan-x pinch-zoom" : "pan-y pinch-zoom")
        : (orientation === "vertical" ? "pan-y" : "pan-x"),
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
      onKeyDown: keyboardCfg.global ? undefined : keyboard.onKeyDown,
      onTouchStart: gestureCfg.touch === "controlled" ? undefined : handleTouchStart,
      onTouchEnd: gestureCfg.touch === "controlled" ? undefined : handleTouchEnd,
      onTouchCancel: gestureCfg.touch === "controlled" ? undefined : handleTouchEnd,
      ...(options.inputTarget ? {} : gestures.handlers),
      style: virtualStyles,
    } satisfies React.HTMLAttributes<HTMLElement> & { ref: React.RefCallback<HTMLElement> };
  }, [options.inputTarget, ariaLabel, gestureCfg.touch, handleScroll, handleTouchStart, handleTouchEnd, isAnimating, keyboard.onKeyDown, keyboardCfg.global, orientation, gestures.handlers]);

  const getItemProps = useCallback(
    (itemIndex: number) => {
      const isActive = index === itemIndex;

      // Use CSS viewport units for positioning - these automatically update on rotation!
      // This is much simpler and more reliable than trying to correct pixel offsets.
      const sizeUnit = gestureCfg.touch === 'controlled' ? `${virtualizer.containerSize}px` : orientation === 'vertical' ? '100dvh' : '100dvw';

      return {
        ref: getItemRef(itemIndex),
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
          // Native Snap Item Styles
          scrollSnapAlign: "start",
          scrollSnapStop: "always" satisfies React.CSSProperties["scrollSnapStop"],
        } satisfies React.CSSProperties,
      };
    },
    [getItemRef, index, orientation, gestureCfg.touch, virtualizer.containerSize],
  );

  const prev = useCallback(() => navigateTo(latest.current.index - 1, "programmatic"), [navigateTo]);
  const next = useCallback(() => navigateTo(latest.current.index + 1, "programmatic"), [navigateTo]);
  const getMotion = useCallback(() => motionRef.current, []);

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
    getMotion,
  }), [apiState, prev, next, navigateTo, getViewportProps, getItemProps, virtualizer.virtualItems, virtualizer.totalSize, items, orientation, viewport, getMotion]);

  return api;
}
