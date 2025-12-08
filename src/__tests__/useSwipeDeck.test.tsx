// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SwipeDeck } from "../components/SwipeDeck";
import { useSwipeDeck } from "../hooks/useSwipeDeck";

describe("useSwipeDeck / <SwipeDeck>", () => {
  it("defaults to native mode with initial index 0", () => {
    function Probe() {
      const deck = useSwipeDeck({ items: [1, 2, 3] });
      return <div data-testid="probe" data-index={deck.index} data-mode={deck.resolvedMode} />;
    }
    render(<Probe />);
    const probe = screen.getByTestId("probe");
    expect(probe.getAttribute("data-index")).toBe("0");
    expect(probe.getAttribute("data-mode")).toBe("native");
  });

  it("renders items and marks first as active", () => {
    render(
      <SwipeDeck items={[{ id: "a" }, { id: "b" }, { id: "c" }]}>
        {({ item, props, isActive }) => (
          <div {...props} data-testid={`item-${item.id}`} data-active={isActive} />
        )}
      </SwipeDeck>,
    );

    const first = screen.getByTestId("item-a");
    const second = screen.getByTestId("item-b");
    expect(first.getAttribute("data-active")).toBe("true");
    expect(second.getAttribute("data-active")).toBe("false");
  });
});

