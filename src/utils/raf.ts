type RafId = number | undefined;

export function raf(cb: FrameRequestCallback): RafId {
  return typeof requestAnimationFrame === "function" ? requestAnimationFrame(cb) : undefined;
}

export function cancelRaf(id: RafId) {
  if (id === undefined) return;
  if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(id);
}

// Schedule a callback on the next animation frame and return a cancel handle.
export function rafBatch(cb: () => void) {
  const handle: RafId = raf(() => cb());
  return () => cancelRaf(handle);
}

