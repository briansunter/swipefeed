import { useCallback } from "react";
import { prefersReducedMotion } from "../utils/prefersReducedMotion";
import type { ScrollBehavior } from "../types";

type UseScrollToParams = {
  getViewport: () => HTMLElement | null;
  setAnimating?: (value: boolean) => void;
};

export function useScrollTo({ getViewport, setAnimating }: UseScrollToParams) {
  const scrollToIndex = useCallback(
    (offset: number, behavior?: ScrollBehavior) => {
      const viewport = getViewport();
      if (!viewport) return;
      const effectiveBehavior: ScrollBehavior =
        behavior ?? (prefersReducedMotion() ? "instant" : "smooth");

      try {
        setAnimating?.(effectiveBehavior === "smooth");
        viewport.scrollTo({
          top: offset,
          left: offset,
          behavior: effectiveBehavior === "auto" ? "auto" : effectiveBehavior,
        });
      } finally {
        if (effectiveBehavior !== "smooth") {
          setAnimating?.(false);
        }
      }
    },
    [getViewport, setAnimating],
  );

  return { scrollToIndex };
}

