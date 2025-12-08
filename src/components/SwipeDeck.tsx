import type { JSX } from "react";
import React, { forwardRef, useImperativeHandle } from "react";
import { useSwipeDeck } from "../hooks/useSwipeDeck";
import type { SwipeDeckHandle, SwipeDeckProps } from "../types";

type AsIntrinsic = keyof JSX.IntrinsicElements & string;
type AsComponent = AsIntrinsic | React.ComponentType<unknown>;

export const SwipeDeck = forwardRef(function SwipeDeckInner<T>(
  props: SwipeDeckProps<T>,
  ref: React.Ref<SwipeDeckHandle>,
) {
  const {
    as: As = "div" as AsComponent,
    children,
    className,
    style,
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
        resolvedMode: deck.resolvedMode,
      }),
    }),
    [deck],
  );

  const viewportProps = deck.getViewportProps();

  return (
    <As {...(viewportProps as any)} className={className} style={style}>
      {deck.virtualItems.map(virtual => {
        const item = deck.items[virtual.index];
        return (
          <React.Fragment key={virtual.key}>
            {children({
              item,
              index: virtual.index,
              isActive: deck.index === virtual.index,
              props: deck.getItemProps(virtual.index),
            })}
          </React.Fragment>
        );
      })}
    </As>
  );
}) as <T>(
  props: SwipeDeckProps<T> & { ref?: React.Ref<SwipeDeckHandle> },
) => React.ReactElement;

