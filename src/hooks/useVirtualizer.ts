import { useEffect, useLayoutEffect, useState, useMemo, useCallback } from "react";
import { useVirtualizer as useTanStackVirtualizer } from "@tanstack/react-virtual";
import type { VirtualConfig, SwipeDeckVirtualItem, Orientation } from "../types";

// Use useLayoutEffect on client, useEffect on server (SSR safety)
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type UseVirtualizerParams<T> = {
  items: readonly T[];
  virtual: VirtualConfig | undefined;
  getScrollElement: () => HTMLElement | null;
  orientation?: Orientation;
};

type VirtualizerResult = {
  virtualItems: SwipeDeckVirtualItem[];
  totalSize: number;
  getItemOffset: (index: number) => number;
  getItemSize: (index: number) => number;
  scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto', behavior?: 'auto' | 'smooth' }) => void;
  containerSize: number;
};

/**
 * Simplified adapter using @tanstack/react-virtual
 * Auto-detects viewport size when estimatedSize is not provided.
 */
export function useVirtualizer<T>(params: UseVirtualizerParams<T>): VirtualizerResult {
  const { items, virtual, getScrollElement, orientation = "vertical" } = params;
  const count = items.length;

  // Auto-detect viewport size when estimatedSize is not provided
  // Use state with a "generation" counter to force re-render when element is measured
  const [sizeState, setSizeState] = useState<{ size: number; measured: boolean }>(() => {
    // Initial fallback: use window size if available, else 800
    const fallback = typeof window !== "undefined"
      ? (orientation === "vertical" ? window.innerHeight : window.innerWidth)
      : 800;
    return { size: fallback, measured: false };
  });

  // Use useLayoutEffect to measure BEFORE paint - this fixes the black screen on initial load
  useIsomorphicLayoutEffect(() => {
    const scrollElement = getScrollElement();
    if (!scrollElement) return;

    const updateSize = () => {
      const size = orientation === "vertical"
        ? scrollElement.clientHeight
        : scrollElement.clientWidth;

      if (size > 0) {
        setSizeState(prev => {
          // Only update if size changed or first measurement
          if (prev.size !== size || !prev.measured) {
            return { size, measured: true };
          }
          return prev;
        });
      }
    };

    // Measure immediately (synchronously before paint)
    updateSize();

    // Watch for resizes
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(scrollElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [getScrollElement, orientation]);

  const measuredSize = sizeState.size;

  // Always prioritize measured size for consistency - explicit estimatedSize is only used
  // if it's a function (for dynamic item sizes) or if we haven't measured yet
  const getEstimatedSize = useCallback((i: number): number => {
    const explicitSize = virtual?.estimatedSize;

    // If explicit size is a function, use it (supports dynamic item sizing)
    if (typeof explicitSize === 'function') {
      return explicitSize(items[i], i);
    }

    // Use measured size if available and valid, otherwise fall back to explicit or default
    if (measuredSize > 0) {
      return measuredSize;
    }

    // Fall back to explicit size or default
    return typeof explicitSize === 'number' ? explicitSize : 800;
  }, [virtual?.estimatedSize, items, measuredSize]);

  // Compute initialRect from window size for first render (before scroll element is available)
  const initialRect = useMemo(() => {
    if (typeof window === "undefined") {
      return { width: 800, height: 800 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }, []);

  // Memoize getItemKey wrapper to prevent infinite re-renders
  const getItemKey = useMemo(() => {
    if (!virtual?.getItemKey) return undefined;
    return (index: number) => virtual.getItemKey?.(items[index], index) ?? index;
  }, [virtual?.getItemKey, items]);

  const rowVirtualizer = useTanStackVirtualizer({
    count,
    getScrollElement,
    estimateSize: getEstimatedSize,
    overscan: virtual?.overscan ?? 5,
    horizontal: orientation === "horizontal",
    getItemKey,
    // CRITICAL: Provide initialRect so virtualizer can calculate items on first render
    // even when getScrollElement() returns null
    initialRect,
  });

  // NOTE: Do NOT wrap this in useMemo! The rowVirtualizer object is stable,
  // but getVirtualItems() returns different results on each scroll event.
  // Wrapping in useMemo causes stale virtualItems that don't update on scroll.
  return {
    virtualItems: rowVirtualizer.getVirtualItems().map(item => ({
      index: item.index,
      key: item.key as string | number,
      offset: item.start,
      size: item.size,
      measureElement: rowVirtualizer.measureElement,
    })),
    totalSize: rowVirtualizer.getTotalSize(),
    getItemOffset: (index: number) => {
      const found = rowVirtualizer.getVirtualItems().find(v => v.index === index);
      return found ? found.start : 0;
    },
    getItemSize: (index: number) => {
      const found = rowVirtualizer.getVirtualItems().find(v => v.index === index);
      return found ? found.size : 0;
    },
    scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto', behavior?: 'auto' | 'smooth' }) => {
      rowVirtualizer.scrollToIndex(index, {
        align: options?.align,
        behavior: options?.behavior,
      });
    },
    containerSize: measuredSize,
  };
}
