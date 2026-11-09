# Changelog

All notable changes to `react-treecraft` are documented here.
This project follows [Semantic Versioning](https://semver.org/); while below 1.0, breaking changes bump the minor version.

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
