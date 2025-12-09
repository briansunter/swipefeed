import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef, useImperativeHandle } from "react";
import { useSwipeDeck } from "../hooks/useSwipeDeck";
export const SwipeDeck = forwardRef(function SwipeDeckInner(props, ref) {
    const { as: As = "div", children, className, style, ...options } = props;
    const deck = useSwipeDeck(options);
    useImperativeHandle(ref, () => ({
        prev: deck.prev,
        next: deck.next,
        scrollTo: deck.scrollTo,
        getState: () => ({
            index: deck.index,
            isAnimating: deck.isAnimating,
            canPrev: deck.canPrev,
            canNext: deck.canNext,
        }),
    }), [deck]);
    const { style: virtualStyle, ...restViewportProps } = deck.getViewportProps();
    return (_jsx(As, { ...restViewportProps, className: className, style: { ...virtualStyle, ...style }, children: _jsx("div", { style: { height: deck.totalSize, width: "100%", position: "relative" }, children: deck.virtualItems.map(virtual => {
                const item = deck.items[virtual.index];
                const itemProps = deck.getItemProps(virtual.index);
                return (_jsx("div", { ...itemProps, children: children({
                        item,
                        index: virtual.index,
                        isActive: deck.index === virtual.index,
                        props: itemProps,
                    }) }, virtual.key));
            }) }) }));
});
