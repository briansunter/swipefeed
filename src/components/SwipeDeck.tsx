import type { JSX } from "react";
import React, { useImperativeHandle, useMemo } from "react";
import { useSwipeDeck } from "../hooks/useSwipeDeck";
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

  const viewportStyle = useMemo(
    () => ({ ...virtualStyle, ...style }),
    [virtualStyle, style],
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
          return (
            <div
              key={virtual.key}
              {...itemProps}
              role="article"
              aria-label={`Item ${virtual.index + 1} of ${deck.items.length}`}
            >
              {children({
                item,
                index: virtual.index,
                isActive: deck.index === virtual.index,
                props: itemProps,
              })}
            </div>
          );
        })}
      </div>
    </Comp>
  );
}

