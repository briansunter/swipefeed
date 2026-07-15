import type { SwipeDeckMotion } from "./types";

type CalculateSwipeDeckMotionOptions = {
  scrollOffset: number;
  viewportSize: number;
  itemCount: number;
  previousScrollOffset?: number;
  settleTolerance?: number;
};

const DEFAULT_SETTLE_TOLERANCE_PX = 1;

export function createInitialSwipeDeckMotion(index = 0): SwipeDeckMotion {
  const normalizedIndex = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  return {
    scrollOffset: 0,
    viewportSize: 0,
    position: normalizedIndex,
    index: normalizedIndex,
    offset: 0,
    offsetRatio: 0,
    direction: "none",
    isSettled: true,
  };
}

export function calculateSwipeDeckMotion({
  scrollOffset,
  viewportSize,
  itemCount,
  previousScrollOffset,
  settleTolerance = DEFAULT_SETTLE_TOLERANCE_PX,
}: CalculateSwipeDeckMotionOptions): SwipeDeckMotion {
  if (!Number.isFinite(viewportSize) || viewportSize <= 0 || !Number.isFinite(itemCount) || itemCount <= 0) {
    return createInitialSwipeDeckMotion();
  }

  const normalizedItemCount = Math.floor(itemCount);
  const maxScrollOffset = (normalizedItemCount - 1) * viewportSize;
  const normalizedScrollOffset = Number.isFinite(scrollOffset)
    ? Math.max(0, Math.min(maxScrollOffset, scrollOffset))
    : 0;
  const position = normalizedScrollOffset / viewportSize;
  const index = Math.max(0, Math.min(normalizedItemCount - 1, Math.round(position)));
  const offset = index * viewportSize - normalizedScrollOffset;
  const normalizedPreviousOffset = Number.isFinite(previousScrollOffset)
    ? Math.max(0, Math.min(maxScrollOffset, previousScrollOffset ?? 0))
    : normalizedScrollOffset;
  const direction = normalizedScrollOffset > normalizedPreviousOffset
    ? "forward"
    : normalizedScrollOffset < normalizedPreviousOffset
      ? "backward"
      : "none";

  return {
    scrollOffset: normalizedScrollOffset,
    viewportSize,
    position,
    index,
    offset,
    offsetRatio: offset / viewportSize,
    direction,
    isSettled: Math.abs(offset) <= Math.max(0, settleTolerance),
  };
}
