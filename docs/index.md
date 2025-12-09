# swipefeed docs

Headless React primitives for building TikTok/Reels-style swipe feeds. The library ships a render-prop component (`SwipeDeck`) and a hook (`useSwipeDeck`) that wire up native scroll-snap, TanStack virtualization, gesture/wheel/keyboard inputs, accessibility, and programmatic controls. Imports come from the package name declared in `package.json` (currently `@brian/tiktok-swipe`).

## Installation

```bash
bun add @brian/tiktok-swipe
# or
npm install @brian/tiktok-swipe
```

Peer deps: `react@^19`, `react-dom@^19`.

## Core ideas

- **Headless**: you own the markup and styling; the library returns props/refs and state.
- **Scroll is source of truth**: the active index is derived from scroll position/virtual range.
- **Native snap + virtualizer**: uses CSS scroll-snap for touch/drag and `@tanstack/react-virtual` for offsets and large lists.
- **Multiple inputs**: pointer drag + flick, discrete wheel paging with heavy dampening, keyboard (global or scoped), and programmatic controls.
- **Accessibility-first**: focusable `role="feed"` viewport, per-item `role="article"`, RTL-aware inputs, reduced-motion friendly scrolling.

## Quick start — component

```tsx
import { SwipeDeck } from "@brian/tiktok-swipe";

function Feed({ items }) {
  return (
    <SwipeDeck items={items} className="w-full h-screen overflow-hidden">
      {({ item, isActive, props }) => (
        <section {...props} style={{ height: "100vh" }}>
          <VideoPlayer video={item} playing={isActive} />
        </section>
      )}
    </SwipeDeck>
  );
}
```

## Quick start — hook

```tsx
import { useSwipeDeck } from "@brian/tiktok-swipe";

function CustomLayout({ items }) {
  const deck = useSwipeDeck({ items, orientation: "horizontal", direction: "rtl" });
  const viewportProps = deck.getViewportProps();

  return (
    <div {...viewportProps} style={{ ...viewportProps.style, height: "100vh" }}>
      <div style={{ width: deck.totalSize, position: "relative" }}>
        {deck.virtualItems.map((virtual) => {
          const props = deck.getItemProps(virtual.index);
          return (
            <article key={virtual.key} {...props}>
              {items[virtual.index].title}
            </article>
          );
        })}
      </div>
    </div>
  );
}
```

## API reference

### `<SwipeDeck>` props

Extends `SwipeDeckOptions<T>` plus:
- `as`: custom element/component for the viewport (default `"div"`).
- `children(context)`: render prop receiving `{ item, index, isActive, props }`.
- `className`, `style`: forwarded to the viewport.
- `ref`: imperative handle (`SwipeDeckHandle`) exposing `prev`, `next`, `scrollTo`, `getState`.

### `SwipeDeckOptions<T>`

- `items` **(required)**: readonly array.
- `orientation`: `"vertical"` (default) | `"horizontal"`.
- `direction`: `"ltr"` (default) | `"rtl"` (affects horizontal wheel/gestures/keyboard).
- `defaultIndex`: initial index for uncontrolled mode (default `0`).
- `index`: controlled index; when set, update it yourself in `onIndexChange`.
- `onIndexChange(index, source)`: fires for every navigation. `source` is one of `"user:gesture" | "user:wheel" | "user:keyboard" | "programmatic" | "snap"`.
- `loop`: wrap navigation at the ends (default `false`).
- `gesture`: `{ threshold, flickVelocity, lockAxis, ignoreWhileAnimating }` (defaults `10`, `0.1`, `true`, `true`).
- `wheel`: `{ discretePaging, threshold, debounce, cooldown }` (defaults `true`, `100`, `120ms`, `800ms`) with aggressive dampening to avoid multi-item jumps.
- `keyboard`: `{ enabled, global, bindings }` (default enabled, viewport-scoped). Bindings default to arrows + Home/End + Page keys; RTL flips horizontal intent.
- `keyboardNavigation`: boolean shorthand to disable keyboard entirely (default `true`).
- `virtual`: `{ overscan, estimatedSize, getItemKey }` (defaults `5`, auto-measured viewport size, index key). Backed by `@tanstack/react-virtual`.
- `endReachedThreshold`: number of items from ends to trigger `onEndReached` (default `3`).
- `onEndReached({ distanceFromEnd, direction })`: fires near start or end when within threshold.
- `ariaLabel`: feed label (default `"Swipe feed"`).
- `visibility`: reserved for future visibility strategies (currently unused).
- `onItemActive`, `onItemInactive`: reserved hooks for future activation callbacks (currently no-ops).

### Render context (children)

- `item`: data item
- `index`: item index
- `isActive`: whether the item is the centered/active one
- `props`: spread onto your item element (includes refs, transforms, snap styles, data attributes)

### Imperative handle (`SwipeDeckHandle`)

- `prev()`, `next()`
- `scrollTo(index, { behavior })`
- `getState()`: `{ index, isAnimating, canPrev, canNext }`

### `useSwipeDeck` return shape

- State: `index`, `isAnimating`, `canPrev`, `canNext`, `items`, `orientation`
- Actions: `prev()`, `next()`, `scrollTo(index, { behavior })`
- Layout: `virtualItems` (offset/size/key/measureElement), `totalSize`
- Props helpers: `getViewportProps()`, `getItemProps(index)`

### Helper hook

- `useWindowSize()`: throttled `{ width, height }`

## Input handling details

- **Gestures**: pointer drag + flick; axis locking, threshold + velocity decision; optional ignore-during-animation; RTL-aware for horizontal decks.
- **Wheel**: discrete paging with direction locking, debounce, cooldown, per-event delta caps, and accumulation caps to stop trackpad flicks from skipping multiple items.
- **Keyboard**: arrow/Home/End/PageUp/PageDown; can be global (`keyboard.global`) or scoped to the viewport; RTL handling for horizontal.
- **Programmatic**: `scrollTo` chooses `smooth` vs `instant` based on `prefers-reduced-motion` and temporarily disables snap during navigation to avoid fighting CSS snap.

## Virtualization

- Always uses `@tanstack/react-virtual` for consistent offsets and large lists.
- If `virtual.estimatedSize` is omitted, the viewport is measured via `ResizeObserver` and used as the estimate (slides default to viewport size).
- `virtual.getItemKey` lets you supply stable keys; otherwise the index is used.
- `virtual.overscan` controls how many items render around the viewport (default `5`).

## Accessibility

- Viewport: `role="feed"`, `aria-label`, `aria-busy` during animation, `tabIndex=0`, native scroll-snap, axis-specific `touch-action`.
- Items: `role="article"` with an `aria-label` that includes position/length; snap alignment applied per item.
- RTL-aware keyboard and wheel for horizontal feeds.
- Respects `prefers-reduced-motion` (falls back to instant scroll).

## Controlled vs uncontrolled

- Uncontrolled: omit `index`; component manages state starting from `defaultIndex`.
- Controlled: pass `index` and update it in `onIndexChange`; all inputs still fire the callback with a `source`.
- `loop` wraps gesture, wheel, keyboard, and programmatic navigation.

## End reached / infinite loading

- `onEndReached` fires near either end when within `endReachedThreshold` items.
- Use `direction` from the callback to know whether the user is approaching start or end.

## Styling checklist

- Give the viewport a concrete size (e.g., `h-screen`); keep `overflow: auto`.
- Items are absolutely positioned with transforms from `getItemProps`; set item height/width to fill the viewport (`100vh`/`100%`) for full-screen feeds.
- For full-screen apps ensure `html, body, #root` are `height: 100%`.
- Avoid overriding `scroll-snap-type`/`touch-action` on the viewport unless you know why.

## Example app

A TikTok-style vertical feed using YouTube iframes lives in `example/`.

```bash
bun install            # installs root + workspace deps
bun run build          # optional: build the library first
cd example
bun run dev            # Vite dev server (default http://localhost:5173)
```

The example demonstrates render-prop usage, global keyboard navigation, gesture swipe, mute toggle, and custom UI chrome.

## Dev & test scripts (root)

- `bun run build` — bundle `src/` to `dist/` with sourcemaps.
- `bun run test` — Vitest jsdom suite.
- `bun run test:browser` — Vitest browser runner (wheel/scroll integration).
- `bun run test:coverage`, `bun run test:browser:coverage`, `bun run coverage:merge` — coverage reports/merge.
- `bun run lint` / `bun run format` — Biome lint/format.
- `bun run typecheck` — TypeScript.
- `bun run storybook` / `bun run storybook:build` — Storybook dev/build.
- `bun run docs:api` - generate markdown API docs in `docs/api`.

## Troubleshooting

- **Viewport doesn’t fill the screen**: ensure `html, body, #root` and your viewport element have explicit height; items should set height/width accordingly.
- **Snapping feels stuck**: don’t override the viewport’s `scroll-snap-type`; `scrollTo` temporarily disables snap during animation and restores it.
- **Trackpad scroll skips multiple items**: keep wheel `discretePaging` enabled (default) and tune `wheel.threshold/debounce/cooldown` as needed.
- **Horizontal + RTL**: set `orientation="horizontal"` and `direction="rtl"`; keyboard/wheel/gestures respect RTL.
- **Reduced motion**: `prefers-reduced-motion` uses instant scroll; you can force behavior via `scrollTo(index, { behavior: "smooth" | "instant" })`.

## Status

`visibility`, `onItemActive`, and `onItemInactive` options are present for future parity with the design spec but are not wired yet.

