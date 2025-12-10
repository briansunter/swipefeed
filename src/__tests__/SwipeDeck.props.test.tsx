
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SwipeDeck } from "../components/SwipeDeck";
import "@testing-library/jest-dom";
import type { SwipeDeckRenderContext } from "../types";

/**
 * @vitest-environment jsdom
 */

describe("SwipeDeck Props", () => {
    it("renders with fullscreen styles when fullscreen prop is true", () => {
        const { container } = render(
            <SwipeDeck<number>
                items={[1]}
                fullscreen={true}
            >
                {(context: SwipeDeckRenderContext<number>) => <div>{context.item}</div>}
            </SwipeDeck>
        );

        // container.firstChild is the SwipeDeck root element (Comp)
        const viewport = container.firstChild;
        expect(viewport).toHaveStyle({
            height: "100dvh",
            width: "100%",
            position: "absolute",
            top: "0",
            left: "0",
            overflow: "auto"
        });
    });

    it("renders without fullscreen styles when fullscreen prop is false/undefined", () => {
        const { container } = render(
            <SwipeDeck<number>
                items={[1]}
            // fullscreen={false} // default
            >
                {(context: SwipeDeckRenderContext<number>) => <div>{context.item}</div>}
            </SwipeDeck>
        );

        const viewport = container.firstChild;
        // Should not have the fullscreen specific styles
        expect(viewport).not.toHaveStyle({
            height: "100dvh",
            position: "absolute"
        });
    });
});
