export { useSwipeDeck } from "./hooks/useSwipeDeck";
export { useWindowSize } from "./hooks/useWindowSize";
export { SwipeDeck } from "./components/SwipeDeck";

export type {
  SwipeDeckOptions,
  SwipeDeckAPI,
  SwipeDeckState,
  SwipeDeckActions,
  SwipeDeckVirtualItem,
  SwipeDeckProps,
  SwipeDeckHandle,
  SwipeDeckRenderContext,
  IndexChangeSource,
  Orientation,

  Direction,
  ScrollBehavior,
} from "./types";

// Testing helpers
export { simulateSwipe } from "./testing/simulateSwipe";
export { simulateWheel } from "./testing/simulateWheel";

