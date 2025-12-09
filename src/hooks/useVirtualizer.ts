import { useEffect, useState } from "react";
import { useVirtualizer as useTanStackVirtualizer } from "@tanstack/react-virtual";
import type { VirtualConfig, SwipeDeckVirtualItem, Orientation } from "../types";

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
};

/**
 * Simplified adapter using @tanstack/react-virtual
 * Auto-detects viewport size when estimatedSize is not provided.
 */
export function useVirtualizer<T>(params: UseVirtualizerParams<T>): VirtualizerResult {
  const { items, virtual, getScrollElement, orientation = "vertical" } = params;
  const count = items.length;

  // Auto-detect viewport size when estimatedSize is not provided
  const [measuredSize, setMeasuredSize] = useState<number>(() => {
    // Initial fallback: use window size if available, else 800
    if (typeof window !== "undefined") {
      return orientation === "vertical" ? window.innerHeight : window.innerWidth;
    }
    return 800;
  });

  useEffect(() => {
    const scrollElement = getScrollElement();
    if (!scrollElement) return;

    const updateSize = () => {
      const size = orientation === "vertical"
        ? scrollElement.clientHeight
        : scrollElement.clientWidth;
      if (size > 0) {
        setMeasuredSize(size);
      }
    };

    // Measure immediately
    updateSize();

    // Watch for resizes
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(scrollElement);

    return () => resizeObserver.disconnect();
  }, [getScrollElement, orientation]);

  const getEstimatedSize = (i: number): number => {
    const explicitSize = virtual?.estimatedSize;
    if (explicitSize !== undefined) {
      return typeof explicitSize === 'function' ? explicitSize(items[i], i) : explicitSize;
    }
    // Fall back to measured viewport size
    return measuredSize;
  };

  const rowVirtualizer = useTanStackVirtualizer({
    count,
    getScrollElement,
    estimateSize: getEstimatedSize,
    overscan: virtual?.overscan ?? 5,
    horizontal: orientation === "horizontal",
    getItemKey: virtual?.getItemKey ? (index) => virtual.getItemKey!(items[index], index) : undefined,
  });

  return {
    virtualItems: rowVirtualizer.getVirtualItems().map(item => ({
      index: item.index,
      key: item.key as string | number,
      offset: item.start,
      size: item.size,
      measureElement: rowVirtualizer.measureElement,
    })),
    totalSize: rowVirtualizer.getTotalSize(),
    getItemOffset: (index) => {
      const found = rowVirtualizer.getVirtualItems().find(v => v.index === index);
      return found ? found.start : 0;
    },
    getItemSize: (index) => {
      const found = rowVirtualizer.getVirtualItems().find(v => v.index === index);
      return found ? found.size : 0;
    },
    scrollToIndex: (index, options) => {
      rowVirtualizer.scrollToIndex(index, {
        align: options?.align,
        behavior: options?.behavior,
      });
    },
  };
}
