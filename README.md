<div align="center">

<a href="https://www.npmjs.com/package/react-treecraft"><img src="https://img.shields.io/npm/v/react-treecraft.svg?style=flat-square&colorA=0d1117&colorB=6366f1" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/react-treecraft"><img src="https://img.shields.io/npm/dm/react-treecraft?style=flat-square&colorA=0d1117&colorB=6366f1" alt="npm downloads" /></a>
<a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-6366f1.svg?style=flat-square&colorA=0d1117" alt="MIT License" /></a>
<a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-Ready-6366f1.svg?style=flat-square&colorA=0d1117" alt="TypeScript" /></a>

<br/>

<img src="https://react-treecraft.vercel.app/images/logo-light.png" alt="React TreeCraft" width="100%" />

<br/>

<p><strong>A headless, minimal, and highly customizable tree structure builder for React.</strong><br/>Zero assumptions. Full control.</p>

</div>

---

## Installation

```bash
npm install react-treecraft
# or
yarn add react-treecraft
# or
pnpm add react-treecraft
```

Import the base styles once in your entry point:

```ts
import 'react-treecraft/styles';
```

## Quick Start

```tsx
import { TreeCraft } from 'react-treecraft';
import 'react-treecraft/styles';

<TreeCraft
  data={treeData}
  renderNode={({ node }) => <div>{node.data.name}</div>}
/>
```

---

## Docs & Live Playground

**-> [react-treecraft.vercel.app](https://react-treecraft.vercel.app)**

Full API reference, interactive demos, and code examples live there.

---

## Highlights

- **100% Headless** — render any JSX for each node, no UI opinions
- **Vertical & Horizontal** layout orientations
- **Customizable Connectors** — orthogonal, curved, or straight; solid, dashed, dotted, or animated flow
- **Drag & Drop** — reorder siblings or reparent nodes with cycle protection
- **Export** — PNG, SVG, and JSON canvas export + JSON import
- **Mini-Map** — interactive corner overview
- **Live Search** — instant path highlighting and auto-expansion
- **Zoom & Pan** — smooth scroll-to-zoom with canvas drag
- **`useTreeCraft` Hook** — immutable tree mutations, collapse/expand, selection state
- **Zero Runtime Dependencies** — only `react` and `react-dom` as peers

---

## License

MIT © [Selahadin Hamid](https://github.com/sallah26)
