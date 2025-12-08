export async function simulateWheel(
  element: HTMLElement,
  opts: { deltaX?: number; deltaY?: number } = {},
) {
  const { deltaX = 0, deltaY = 0 } = opts;
  element.dispatchEvent(
    new WheelEvent("wheel", {
      bubbles: true,
      deltaX,
      deltaY,
    }),
  );
}

