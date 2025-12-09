let cached: boolean | null = null;

export function prefersReducedMotion(): boolean {
  if (cached !== null) return cached;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    cached = false;
    return cached;
  }
  cached = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return cached;
}

