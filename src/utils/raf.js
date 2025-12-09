export function raf(cb) {
    return typeof requestAnimationFrame === "function" ? requestAnimationFrame(cb) : undefined;
}
export function cancelRaf(id) {
    if (id === undefined)
        return;
    if (typeof cancelAnimationFrame === "function")
        cancelAnimationFrame(id);
}
// Schedule a callback on the next animation frame and return a cancel handle.
export function rafBatch(cb) {
    const handle = raf(() => cb());
    return () => cancelRaf(handle);
}
