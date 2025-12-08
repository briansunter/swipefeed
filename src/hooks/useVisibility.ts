import { useMemo, useCallback } from "react";
import { debounce } from "../utils/debounce";

type VisibilityParams = {
  itemCount: number;
  getItemOffset: (index: number) => number;
  getItemSize: (index: number) => number;
  strategy: "position" | "intersection";
  intersectionRatio: number;
  debounceMs: number;
  onActive: (index: number) => void;
};

/**
 * Visibility helper: derive active index from scroll position or intersection ratios.
 */
export function useVisibility(params: VisibilityParams) {
  const { itemCount, getItemOffset, getItemSize, strategy, intersectionRatio, debounceMs, onActive } = params;

  const setActive = useMemo(() => debounce((index: number) => onActive(index), debounceMs), [debounceMs, onActive]);

  const calculateFromPosition = useCallback(
    (scrollOffset: number, viewportSize: number) => {
      if (itemCount === 0) return;
      const viewportCenter = scrollOffset + viewportSize / 2;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      for (let i = 0; i < itemCount; i++) {
        const start = getItemOffset(i);
        const center = start + getItemSize(i) / 2;
        const distance = Math.abs(center - viewportCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      }

      setActive(closestIndex);
    },
    [getItemOffset, getItemSize, itemCount, setActive],
  );

  const handleIntersection = useCallback(
    (entries: Array<{ index: number; ratio: number }>) => {
      if (strategy !== "intersection") return;
      const viable = entries.filter(e => e.ratio >= intersectionRatio);
      if (!viable.length) return;
      const top = viable.reduce((best, entry) => (entry.ratio > best.ratio ? entry : best), viable[0]);
      setActive(top.index);
    },
    [intersectionRatio, setActive, strategy],
  );

  return {
    calculateFromPosition,
    handleIntersection,
  };
}

