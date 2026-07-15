export const getPlayerMotion = (
  scrollTop: number,
  viewportHeight: number,
  itemCount: number,
) => {
  if (
    !Number.isFinite(viewportHeight)
    || viewportHeight <= 0
    || !Number.isFinite(itemCount)
    || itemCount <= 0
  ) {
    return { index: 0, offset: 0 };
  }

  const normalizedItemCount = Math.floor(itemCount);
  const maxScrollTop = (normalizedItemCount - 1) * viewportHeight;
  const normalizedScrollTop = Number.isFinite(scrollTop)
    ? Math.max(0, Math.min(maxScrollTop, scrollTop))
    : 0;

  const index = Math.max(
    0,
    Math.min(
      normalizedItemCount - 1,
      Math.round(normalizedScrollTop / viewportHeight),
    ),
  );

  return {
    index,
    offset: index * viewportHeight - normalizedScrollTop,
  };
};
