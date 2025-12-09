import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { SwipeDeck } from "../components/SwipeDeck";
const smallItems = Array.from({ length: 5 }, (_, i) => ({
    id: `art-${i}`,
    title: `Artwork #${i + 1}`,
}));
const largeItems = Array.from({ length: 60 }, (_, i) => ({
    id: `vid-${i}`,
    title: `Video #${i + 1}`,
}));
const storiesItems = Array.from({ length: 10 }, (_, i) => ({
    id: `story-${i}`,
    title: `Story ${i + 1}`,
}));
const meta = {
    title: "SwipeDeck/Examples",
    component: SwipeDeck,
    parameters: {
        layout: "fullscreen",
    },
};
export default meta;
export const VerticalNative = {
    args: {
        items: smallItems,
        orientation: "vertical",
        children: ({ item, props, isActive }) => {
            const typed = item;
            return (_jsxs("div", { ...props, style: {
                    height: "80vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isActive ? "#0ea5e9" : "#0f172a",
                    color: "white",
                }, children: [typed.title, " ", isActive ? "(active)" : ""] }));
        },
    },
};
export const VirtualizedFeed = {
    args: {
        items: largeItems,
        virtual: { estimatedSize: 600 },
        orientation: "vertical",
        children: ({ item, props, isActive }) => {
            const typed = item;
            return (_jsx("div", { ...props, style: {
                    position: "absolute",
                    inset: 0,
                    height: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isActive ? "#22c55e" : "#0f172a",
                    color: "white",
                }, children: typed.title }));
        },
    },
};
export const HorizontalStories = {
    args: {
        items: storiesItems,
        orientation: "horizontal",
        loop: true,
        wheel: { discretePaging: false },
        children: ({ item, props, isActive }) => {
            const typed = item;
            return (_jsx("div", { ...props, style: {
                    width: 220,
                    height: 320,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 8px",
                    background: isActive ? "#a855f7" : "#1f2937",
                    color: "white",
                    borderRadius: 12,
                }, children: typed.title }));
        },
    },
};
export const Controlled = {
    render: (args) => {
        const [index, setIndex] = React.useState(0);
        const safeItems = (args.items ?? smallItems);
        return (_jsx(SwipeDeck, { items: safeItems, index: index, onIndexChange: setIndex, children: ({ item, props, isActive }) => {
                const typed = item;
                return (_jsxs("div", { ...props, style: {
                        height: "80vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isActive ? "#f59e0b" : "#0f172a",
                        color: "white",
                    }, children: [typed.title, " (index ", index, ")"] }));
            } }));
    },
    args: {
        items: smallItems,
        // placeholder children for type satisfaction; render overrides
        children: (({ item, props }) => (_jsx("div", { ...props, children: item.title }))),
    },
};
