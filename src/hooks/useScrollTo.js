import { useCallback } from "react";
import { prefersReducedMotion } from "../utils/prefersReducedMotion";
export function useScrollTo({ getViewport, setAnimating }) {
    const scrollToIndex = useCallback((offset, behavior) => {
        const viewport = getViewport();
        if (!viewport)
            return;
        const effectiveBehavior = behavior ?? (prefersReducedMotion() ? "instant" : "smooth");
        try {
            setAnimating?.(effectiveBehavior === "smooth");
            viewport.scrollTo({
                top: offset,
                left: offset,
                behavior: effectiveBehavior === "auto" ? "auto" : effectiveBehavior,
            });
        }
        finally {
            if (effectiveBehavior !== "smooth") {
                setAnimating?.(false);
            }
        }
    }, [getViewport, setAnimating]);
    return { scrollToIndex };
}
