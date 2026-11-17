# Changelog

All notable changes to `react-treecraft` are documented here.
This project follows [Semantic Versioning](https://semver.org/); while below 1.0, breaking changes bump the minor version.

## 0.3.1

### Fixed

- **Zoom and pan no longer shake or stutter on large trees.**
  - A stale value could overwrite the live transform between wheel events, making the canvas jump backward.
  - Every wheel or pan event re-rendered every node. The transform is now applied straight to the canvas, React state is updated at most once per frame, and tree branches are memoized, so zooming no longer re-renders nodes or calls `renderNode`.
  - The MiniMap no longer tears down and re-attaches its listeners on every zoom step.
  - The canvas is promoted to a GPU layer for the whole gesture (released after 400ms idle), so text is sharp again once it settles without flashing mid-gesture.
  - The canvas origin is measured once per gesture instead of on every wheel event (no forced layout per event); line/page wheel units (Firefox) are normalized.
  - Pointer events on the canvas pause during a gesture (`.tc-root--interacting`), so nodes passing under the cursor don't flip hover states.
- **MiniMap no longer flickers while zooming.** The viewport box is now a separate overlay moved directly; the canvas is only redrawn when the tree, selection or theme changes, and it's resized only when its size actually changes. It follows zoom/pan through a lightweight per-frame event instead of a React render.

### Notes

- Tree branches are now memoized: a node re-renders when its own props change. If your `renderNode` reads values that aren't passed through props or React state (for example a mutable ref or a global), those won't trigger a re-render on their own. Normal React state and props work as before.

## 0.3.0

### Breaking changes

- **Styles must be imported explicitly.** The JS bundles no longer import CSS. Previously the CommonJS build ran `require('./index-XXXX.css')`, which crashed Node SSR and Jest, and the stylesheet could load twice. Add this once in your app entry:

  ```ts
  import 'react-treecraft/styles';
  ```

  (`react-treecraft/styles.css` and `react-treecraft/dist/index.css` still work.)

- **Selection: a plain click now selects only the clicked node.** Before, every click added to the selection, so `selectable` trees were always multi-select. Now:
  - A click selects only that node. Clicking the only selected node again deselects it.
  - With `multiSelect`, Shift / Cmd / Ctrl + click adds or removes a node and keeps the rest.
  - `selectPath` mode is unchanged.

  To keep the old additive behaviour, pass `multiSelect` and hold a modifier key, or control the selection yourself with `selectedIds` + `onSelect`.

### Added

- WAI-ARIA tree primitives: `role="tree"` / `treeitem` / `group`, `aria-level`, `aria-expanded`, `aria-selected`, plus a `getNodeProps()` helper for custom node renderers.
- `aria-multiselectable` on the tree when `selectable` and `multiSelect` are both on.

### Fixed

- `TreeSearch` re-rendered continuously when `data` was a single root object instead of an array.
- The `multiSelect` prop was declared and documented but not implemented.
- Node ids that contain quotes or backslashes broke `scrollToNode`, `selectNode` and minimap navigation (the ids are now passed through `CSS.escape`).
- Clicking a minimap node with `zoomable` on could scroll the hidden viewport out of sync with the pan/zoom transform.
- No more `useLayoutEffect does nothing on the server` warnings when rendering on the server (Next.js, Remix, etc.).
- MiniMap colours now update when the page theme changes (a `class` / `data-theme` / `style` change on `<html>` or `<body>`, or the OS colour scheme), not only when their props change.

### Docs

- `defaultCollapsed` is documented as `false`, which is the actual default.
- `levelGap` is documented as `36` everywhere (it was listed as 32 or 48 in places).
