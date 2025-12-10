
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
      overflow: "hidden",
    }
    : {};

  const viewportStyle = useMemo(
    () => ({ ...virtualStyle, ...fullscreenStyle, ...style }),
    [virtualStyle, fullscreenStyle, style],
  );

  const contentStyle = useMemo<React.CSSProperties>(
    () => ({
      height: deck.orientation === "vertical" ? deck.totalSize : "100%",
      width: deck.orientation === "horizontal" ? deck.totalSize : "100%",
      position: "relative",
    }),
    [deck.orientation, deck.totalSize],
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
        {deck.virtualItems.map((virtual) => {
          const item = deck.items[virtual.index];
          const itemProps = deck.getItemProps(virtual.index);
          const preload = options.preload ?? 0;
          const preloadPrevious = options.preloadPrevious ?? 0;

          let shouldPreload = false;
          // Check if we should preload (either next items or previous items)
          if (preload > 0 || preloadPrevious > 0) {
            const currentIndex = deck.index;
            const targetIndex = virtual.index;

            if (!options.loop) {
              // Non-loop: simple index comparison
              const isNext = targetIndex > currentIndex && targetIndex <= currentIndex + preload;
              const isPrev = targetIndex < currentIndex && targetIndex >= currentIndex - preloadPrevious;
              shouldPreload = isNext || isPrev;
            } else {
              // Loop: calculate distance in both directions
              const len = deck.items.length;
              // Forward distance (0 to len-1)
              const forwardDist = (targetIndex - currentIndex + len) % len;
              // Backward distance (0 to len-1)
              const backwardDist = (currentIndex - targetIndex + len) % len;

              const isNext = forwardDist > 0 && forwardDist <= preload;
              const isPrev = backwardDist > 0 && backwardDist <= preloadPrevious;
              shouldPreload = isNext || isPrev;
            }
          }

          const contextValue = {
            item,
            index: virtual.index,
            isActive: deck.index === virtual.index,
            shouldPreload,
            props: itemProps,
          };

          return (
            <article
              key={virtual.key}
              {...itemProps}
              aria-label={`Item ${virtual.index + 1} of ${deck.items.length}`}
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

