// ═══════════════════════════════════════════════════════════════════════════
// Timing Constants (milliseconds)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Minimum time between successive navigations to prevent multi-swipe.
 * Programmatic and snap navigations bypass this cooldown.
 */
export const NAVIGATION_COOLDOWN_MS = 250;

/**
 * Fallback timeout for scrollend event. If the browser's native scrollend
 * event never fires (e.g., due to interrupted scroll), this ensures the
 * navigation lock is released and scroll-snap is restored.
 */
export const SCROLLEND_FALLBACK_TIMEOUT_MS = 400;

/**
 * Safety timeout to clear a stuck isNavigatingRef flag. If a navigation
 * has been in progress for longer than this, the lock is force-released
 * to prevent permanently blocking subsequent navigations.
 */
export const STUCK_NAVIGATION_TIMEOUT_MS = 600;

/**
 * Safety timeout for handleScroll. If the navigation lock has been held
 * for longer than this, force-unlock so scroll events can update the index.
 * Longer than STUCK_NAVIGATION_TIMEOUT_MS since it's a last-resort check.
 */
export const NAVIGATION_LOCK_TIMEOUT_MS = 1500;

/**
 * Debounce delay for snap-correction after scroll stops. After this idle
 * period, the viewport checks alignment and snaps to the current index
 * if misaligned.
 */
export const SNAP_CORRECTION_DEBOUNCE_MS = 150;

/**
 * Debounce delay for resize-based scroll correction. After viewport resize
 * settles, correct scroll position to maintain the current index.
 */
export const RESIZE_CORRECTION_DEBOUNCE_MS = 50;

/**
 * Debounce delay for the useWindowSize hook resize handler.
 */
export const WINDOW_RESIZE_DEBOUNCE_MS = 100;

// ═══════════════════════════════════════════════════════════════════════════
// Scroll/Snap Tolerance
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Base pixel tolerance for snap alignment checks. Scaled by devicePixelRatio
 * at runtime to handle high-DPI displays correctly.
 */
export const SNAP_ALIGNMENT_TOLERANCE_PX = 5;

/**
 * Minimum fraction of item size that scroll must be off by before resize
 * correction triggers. Prevents fighting with CSS scroll-snap.
 */
export const RESIZE_MISALIGNMENT_THRESHOLD = 0.1;

// ═══════════════════════════════════════════════════════════════════════════
// Wheel Constants
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Maximum delta accumulated from a single wheel event for threshold checking.
 * Allows reasonable fast scrolls while dampening extreme values from
 * high-resolution or accelerated scroll wheels.
 */
export const WHEEL_MAX_DELTA_ACCUMULATION = 120;

/**
 * Maximum visual delta per wheel event. Clamps the visual drag so that
 * large mouse wheel jumps (e.g., 100px) appear as smooth nudges (~40px)
 * while continuous trackpad events (usually < 20px) pass through unaffected.
 */
export const WHEEL_MAX_VISUAL_DELTA = 40;

/**
 * Velocity threshold (px/ms) for flick detection on wheel input.
 * When the smoothed velocity exceeds this value, a navigation is triggered
 * even if the accumulated delta hasn't reached the full threshold.
 */
export const WHEEL_FLICK_VELOCITY_THRESHOLD = 1.2;

/**
 * Minimum accumulated delta (px) for a flick to trigger navigation.
 * Prevents accidental flick detection from tiny high-velocity events.
 */
export const WHEEL_FLICK_DISTANCE_THRESHOLD = 20;

/**
 * Exponential moving average weight for velocity smoothing.
 * Higher values (closer to 1) weight historical velocity more.
 * Current: 80% previous + 20% instantaneous.
 */
export const WHEEL_VELOCITY_SMOOTHING_WEIGHT = 0.8;

// ═══════════════════════════════════════════════════════════════════════════
// Virtualizer Constants
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fallback item size in pixels when viewport cannot be measured and no
 * explicit estimatedSize is provided. Only used during SSR or before
 * the scroll element is available.
 */
export const VIRTUALIZER_FALLBACK_SIZE_PX = 800;
