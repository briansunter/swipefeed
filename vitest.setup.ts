import "@testing-library/jest-dom";

// Polyfill PointerEvent for jsdom environments
if (typeof PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {}
  // @ts-expect-error override global
  globalThis.PointerEvent = PointerEventPolyfill;
}

