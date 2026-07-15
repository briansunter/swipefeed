let cached = false;
let initialized = false;

export function prefersReducedMotion(): boolean {
  if (initialized) return cached;

  initialized = true;

  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    cached = false;
    return cached;
  }

  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  cached = mql.matches;

  mql.addEventListener("change", (event) => {
    cached = event.matches;
  });

  return cached;
}
