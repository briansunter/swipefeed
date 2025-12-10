
import type React from "react";
import { useImperativeHandle, useMemo } from "react";
import { useSwipeDeck } from "../hooks/useSwipeDeck";
import { SwipeItemContext } from "../hooks/useSwipeItem";
import type { SwipeDeckHandle, SwipeDeckProps } from "../types";

export function SwipeDeck<T>(
  props: SwipeDeckProps<T> & { ref?: React.Ref<SwipeDeckHandle> },
) {
  const {
    as: As = "div",
    children,
    className,
    style,
    ref,
    ...options
  } = props;

  const deck = useSwipeDeck(options);

  useImperativeHandle(
    ref,
    () => ({
      prev: deck.prev,
      next: deck.next,
      scrollTo: deck.scrollTo,
      getState: () => ({
        index: deck.index,
        isAnimating: deck.isAnimating,
        canPrev: deck.canPrev,
        canNext: deck.canNext,
      }),
      viewport: deck.viewport,
    }),
    [deck],
  );

  const { style: virtualStyle, ...restViewportProps } = deck.getViewportProps();

  /* Fullscreen styles if enabled */
  const fullscreenStyle: React.CSSProperties = props.fullscreen
    ? {
      height: "100dvh",
      width: "100%",
      position: "absolute",
      top: 0,
      left: 0,
    }
    : {};

  const viewportStyle = useMemo(
    () => ({ ...virtualStyle, ...fullscreenStyle, ...style }),
    [virtualStyle, fullscreenStyle, style],
  );

  const contentStyle = useMemo<React.CSSProperties>(
    () => ({
      // Use CSS viewport units for total size - automatically updates on rotation!
      height: deck.orientation === "vertical"
        ? `calc(${deck.items.length} * 100dvh)`
        : "100%",
      width: deck.orientation === "horizontal"
        ? `calc(${deck.items.length} * 100dvw)`
        : "100%",
      position: "relative",
    }),
    [deck.orientation, deck.items.length],
  );

  // Cast As to ElementType to avoid TS issues with polymorphic string/component
  const Comp = As as React.ElementType;

  return (
    <Comp
      {...restViewportProps}
      className={className}
      style={viewportStyle}
    >
      <div style={contentStyle}>
        {deck.items.map((item, itemIndex) => {
          const itemProps = deck.getItemProps(itemIndex);
          const preload = options.preload ?? 0;
          const preloadPrevious = options.preloadPrevious ?? 0;

          let shouldPreload = false;
          // Check if we should preload (either next items or previous items)
          if (preload > 0 || preloadPrevious > 0) {
            const currentIndex = deck.index;

            if (!options.loop) {
              // Non-loop: simple index comparison
              const isNext = itemIndex > currentIndex && itemIndex <= currentIndex + preload;
              const isPrev = itemIndex < currentIndex && itemIndex >= currentIndex - preloadPrevious;
              shouldPreload = isNext || isPrev;
            } else {
              // Loop: calculate distance in both directions
              const len = deck.items.length;
              // Forward distance (0 to len-1)
              const forwardDist = (itemIndex - currentIndex + len) % len;
              // Backward distance (0 to len-1)
              const backwardDist = (currentIndex - itemIndex + len) % len;

              const isNext = forwardDist > 0 && forwardDist <= preload;
              const isPrev = backwardDist > 0 && backwardDist <= preloadPrevious;
              shouldPreload = isNext || isPrev;
            }
          }

          const contextValue = {
            item,
            index: itemIndex,
            isActive: deck.index === itemIndex,
            shouldPreload,
            props: itemProps,
          };

          // Generate stable key from item if possible, otherwise use index
          const itemKey = options.virtual?.getItemKey?.(item, itemIndex) ?? itemIndex;

          return (
            <article
              key={itemKey}
              {...itemProps}
              aria-label={`Item ${itemIndex + 1} of ${deck.items.length}`}
            >
              <SwipeItemContext.Provider value={contextValue}>
                {children(contextValue)}
              </SwipeItemContext.Provider>
            </article>
          );
        })}
      </div>
    </Comp>
  );
}

