# @brian/tiktok-swipe (Design Spec v2)

Headless React primitives for TikTok/Reels-style swipe decks. Behavior follows `process/spec.md`: scroll-driven index, native vs virtualized modes, gesture/wheel/keyboard inputs, visibility callbacks, and accessibility-first defaults.

## Install

```bash
bun install
```

## Usage (basic)

```tsx
import { SwipeDeck } from "@brian/tiktok-swipe";

<SwipeDeck items={items} orientation="vertical">
  {({ item, props, isActive }) => (
    <div {...props} style={{ height: "100vh" }}>
      <VideoPlayer video={item} playing={isActive} />
    </div>
  )}
</SwipeDeck>;
```

Hook variant:

```tsx
import { useSwipeDeck } from "@brian/tiktok-swipe";
const deck = useSwipeDeck({ items, mode: "auto" });
```

## Commands

- `bun run build` – build library to `dist/`
- `bun run test` – Vitest (jsdom, unit-heavy)
- `bun run test:browser` – Vitest browser runner (integration of wheel/scroll)
- `bun run test:coverage` / `bun run test:browser:coverage` – coverage reports (text + lcov)
- `bun run example:dev` – dev bundle for example
- `bun run example:build` – build example to `dist-example/`
- `bun run lint` / `bun run format` / `bun run typecheck`
- `bun run storybook` / `bun run storybook:build`

## Example app

See `example/` for:
- Vertical native feed (scroll-snap)
- Virtualized large feed (TanStack Virtual placeholder)
- Horizontal stories with RTL toggle
- Controlled deck synced to `?i=` in URL

## Testing pyramid

- Unit (jsdom, Bun/Vitest): hooks (`gestures`, `wheel`, `keyboard`, `visibility`, `virtualizer`, `scrollTo`), orchestrator, component props/aria, callbacks, reduced motion, loop, controlled/uncontrolled, endReached.
- Browser (Vite + @vitest/browser): minimal integration for wheel → index change in virtualized mode.
- Storybook: visual/manual scenarios (native, virtualized, horizontal+RTL, controlled, reduced motion).
- Coverage: `coverage/` with lcov/text; thresholds set in `vitest.config.ts` (lines/functions/statements 70, branches 60).

## Key behaviors (from spec)

- Modes: `native` (<50 items) vs `virtualized` (≥50) with `auto` default.
- Scroll is source of truth; index derived from position/visibility.
- Inputs: gestures (threshold+flick), wheel (discrete/continuous), keyboard (arrows, Home/End, Page keys), RTL-aware.
- Visibility: position or IntersectionObserver (ratio, debounce).
- Accessibility: `role="feed"`, `aria-label`, `aria-busy`, `aria-setsize/posinset`, focusable viewport.
- Reduced motion: falls back to instant scroll and softer gesture rules.
- Infinite loading: `onEndReached` with threshold.

## Open questions (kept from spec)

- Momentum in native mode alignment with virtualized feel.
- Index updates during drag vs on settle.
- Guidance for nested scrollable regions.
- Focus restoration/persistence on navigation.

