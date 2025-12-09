export function clamp(value, min, max) {
    if (Number.isNaN(value))
        return min;
    return Math.min(Math.max(value, min), max);
}
