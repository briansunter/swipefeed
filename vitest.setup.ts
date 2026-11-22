import "@testing-library/jest-dom";

// Polyfill PointerEvent for jsdom environments
if (typeof PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;
    isPrimary: boolean;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? "mouse";
      this.isPrimary = init.isPrimary ?? true;
    }
  }
  // @ts-expect-error override global
  globalThis.PointerEvent = PointerEventPolyfill;
}

if (typeof ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    callback: ResizeObserverCallback;
    constructor(cb: ResizeObserverCallback) { this.callback = cb; }
    observe(target: Element) {
      // Trigger immediately for testing
      this.callback([{
        target,
        contentRect: {
          width: 1000,
          height: 1000,
          top: 0, left: 0, bottom: 0, right: 0, x: 0, y: 0,
          toJSON: () => { }
        }
      } as ResizeObserverEntry], this);
    }
    unobserve() { }
    disconnect() { }
  };
}
