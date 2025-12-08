import { useMemo } from "react";
import type { VirtualConfig, SwipeDeckVirtualItem } from "../types";

type UseVirtualizerParams<T> = {
  items: readonly T[];
  virtual: VirtualConfig | undefined;
  resolvedMode: "native" | "virtualized";
};

/**
 * Thin wrapper placeholder. For now, returns simple offsets based on estimated size.
 * TanStack Virtual integration can be layered in without changing the shape.
 */
export function useVirtualizer<T>(params: UseVirtualizerParams<T>): SwipeDeckVirtualItem[] {
  const { items, virtual, resolvedMode } = params;

  const estimated = virtual?.estimatedSize ?? 800;
  const getSize = typeof estimated === "function" ? estimated : () => estimated;

  return useMemo(() => {
    const output: SwipeDeckVirtualItem[] = [];
    let offset = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const size = getSize(item, i);
      const key = virtual?.getItemKey ? virtual.getItemKey(item, i) : i;
      output.push({ index: i, offset, size, key });
      offset += size;
    }
    return output;
  }, [getSize, items, virtual]);
}

