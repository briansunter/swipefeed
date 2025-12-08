import { useVirtualizer as useTanStackVirtualizer } from "@tanstack/react-virtual";
import type { VirtualConfig, SwipeDeckVirtualItem, Orientation } from "../types";

type UseVirtualizerParams<T> = {
  items: readonly T[];
  virtual: VirtualConfig | undefined;
  resolvedMode: "native" | "virtualized";
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
 */
export function useVirtualizer<T>(params: UseVirtualizerParams<T>): VirtualizerResult {
  const { items, virtual, resolvedMode, getScrollElement, orientation = "vertical" } = params;
  const count = items.length;
  const enabled = resolvedMode === "virtualized";

  const rowVirtualizer = useTanStackVirtualizer({
    count: enabled ? count : 0,
    getScrollElement,
    estimateSize: (i) => {
      const est = virtual?.estimatedSize ?? 800;
      if (typeof est === 'function') {
        return est(items[i], i);
      }
      return est;
    },
    overscan: virtual?.overscan ?? 5,
    horizontal: orientation === "horizontal",
    getItemKey: virtual?.getItemKey ? (index) => virtual.getItemKey!(items[index], index) : undefined,
  });

  if (resolvedMode === "native") {
    const estimated = (virtual?.estimatedSize as number) || 800;
    const size = typeof estimated === 'number' ? estimated : 800;
    return {
      virtualItems: items.map((_, i) => ({
        index: i,
        key: i,
        offset: i * size,
        size: size,
        measureElement: undefined,
      })),
      totalSize: items.length * size,
      getItemOffset: (i) => i * size,
      getItemSize: (i) => size,
      scrollToIndex: () => { },
    };
  }

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
