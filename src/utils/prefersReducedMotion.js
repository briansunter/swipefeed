let cached = null;
export function prefersReducedMotion() {
    if (cached !== null)
        return cached;
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        cached = false;
        return cached;
    }
    cached = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return cached;
}
