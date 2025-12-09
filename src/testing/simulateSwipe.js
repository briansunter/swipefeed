export async function simulateSwipe(element, opts = { distance: 0 }) {
    const axis = opts.axis ?? "y";
    const duration = opts.duration ?? 200;
    const startCoord = axis === "y" ? { clientY: 0, clientX: 0 } : { clientY: 0, clientX: 0 };
    const endCoord = axis === "y"
        ? { clientY: startCoord.clientY + opts.distance, clientX: 0 }
        : { clientX: startCoord.clientX + opts.distance, clientY: 0 };
    element.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, ...startCoord }));
    element.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, ...endCoord }));
    // simple timing approximation
    await new Promise(resolve => setTimeout(resolve, duration));
    element.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, ...endCoord }));
}
