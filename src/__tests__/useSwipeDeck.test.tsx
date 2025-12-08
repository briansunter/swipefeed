// @vitest-environment jsdom
import { describe, expect, it, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { SwipeDeck } from "../components/SwipeDeck";
import { useSwipeDeck } from "../hooks/useSwipeDeck";

describe("useSwipeDeck / <SwipeDeck>", () => {
  // Mock clientHeight for virtualization
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 800 });
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 800 });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 400 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 400 });
    // Mock ResizeObserver
    global.ResizeObserver = class ResizeObserver {
      observe() { }
      unobserve() { }
      disconnect() { }
    };
  });

  it("defaults to initial index 0", () => {
    function Probe() {
      const deck = useSwipeDeck({ items: [1, 2, 3] });
      return <div data-testid="probe" data-index={deck.index} />;
    }
    render(<Probe />);
    const probe = screen.getByTestId("probe");
    expect(probe.getAttribute("data-index")).toBe("0");
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

