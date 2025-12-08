import { useCallback } from "react";
import type { Direction, KeyboardConfig, Orientation } from "../types";

type UseKeyboardParams = {
  orientation: Orientation;
  direction: Direction;
  config?: KeyboardConfig;
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
};

const DEFAULT_BINDINGS_VERTICAL = {
  prev: ["ArrowUp"],
  next: ["ArrowDown"],
  first: ["Home"],
  last: ["End"],
  altPrev: ["PageUp"],
  altNext: ["PageDown"],
};

const DEFAULT_BINDINGS_HORIZONTAL = {
  prev: ["ArrowLeft"],
  next: ["ArrowRight"],
  first: ["Home"],
  last: ["End"],
  altPrev: ["PageUp"],
  altNext: ["PageDown"],
};

/**
 * Keyboard navigation: arrow keys, Home/End, PageUp/PageDown.
 */
export function useKeyboard(params: UseKeyboardParams) {
  const { orientation, direction, config, onPrev, onNext, onFirst, onLast } = params;

  const enabled = config?.enabled ?? true;
  const bindings = config?.bindings ?? (orientation === "vertical" ? DEFAULT_BINDINGS_VERTICAL : DEFAULT_BINDINGS_HORIZONTAL);

  const handleKeyDown = useCallback(
    (evt: React.KeyboardEvent) => {
      if (!enabled) return;

      const key = evt.key;

      const prevKeys = [...(bindings.prev ?? []), ...(bindings.altPrev ?? [])];
      const nextKeys = [...(bindings.next ?? []), ...(bindings.altNext ?? [])];

      const isHorizontal = orientation === "horizontal";
      const rtl = direction === "rtl";

      if (prevKeys.includes(key)) {
        evt.preventDefault();
        if (isHorizontal && rtl) onNext();
        else onPrev();
        return;
      }

      if (nextKeys.includes(key)) {
        evt.preventDefault();
        if (isHorizontal && rtl) onPrev();
        else onNext();
        return;
      }

      if (bindings.first?.includes(key)) {
        evt.preventDefault();
        onFirst?.();
        return;
      }

      if (bindings.last?.includes(key)) {
        evt.preventDefault();
        onLast?.();
        return;
      }
    },
    [bindings, direction, enabled, onFirst, onLast, onNext, onPrev, orientation],
  );

  return { onKeyDown: handleKeyDown };
}

