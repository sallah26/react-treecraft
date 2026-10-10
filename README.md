# ⚡ react-treecraft

> A headless, minimal, and highly customizable hierarchical tree structure builder for React. Zero assumptions. Full control.

[![npm version](https://img.shields.io/npm/v/react-treecraft.svg)](https://www.npmjs.com/package/react-treecraft)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

---

## ✨ Features

- 🎨 **100% Headless Node Rendering**: You render whatever JSX card component you want for each node.
- ↕️ **Vertical & ↔️ Horizontal Orientations**: Switch tree direction instantly with `orientation="vertical" | "horizontal"`.
- 📐 **Customizable Connector Lines**:
  - **Styles**: Orthogonal step lines, smooth Bézier curves, or straight diagonal lines.
  - **Corner Radius**: Adjust sharp 90° right angles to smooth rounded bends (`0px` to `32px+`).
  - **Patterns**: `solid`, `dashed`, `dotted`, or `flow` (animated glowing pulses).
  - **Colors & Thickness**: Pure hex strings, CSS colors, and pixel stroke widths.
- 📏 **Fine-Grained Spacing Controls**:
  - `nodeGap`: Adjust spacing between side-by-side sibling nodes on the same level (in pixels).
  - `levelGap`: Adjust vertical/horizontal distance between parent rows and child levels (in pixels).
- 🖐️ **Drag & Drop Reordering & Reparenting**: Reorder siblings (`before` / `after`) or reparent into new parents (`inside`) with cycle protection and custom `canDrop` validator.
- 📸 **Canvas Export & Import**:
  - Export high-resolution raster **PNG** or standalone vector **SVG**.
  - Export and import **JSON** tree structures.
  - Dedicated `<TreeExport />` UI companion component.
- 🗺️ **Mini-Map Overview**: Interactive corner mini-map with position selection (`top-left`, `top-right`, `bottom-left`, `bottom-right`).
- 🔍 **Live Search**: Instant path highlighting and auto-expansion with `<TreeSearch />`.
- 🔍 **Zoom & Pan**: Smooth scroll-to-zoom and canvas drag panning.
- 🪝 **`useTreeCraft` State Hook**: Built-in immutable tree mutations (`addChild`, `removeNode`, `updateNode`, `moveNode`), collapse/expand controls, and selection state.
- 📦 **Zero External Dependencies** (only `react` and `react-dom` as peer dependencies).

---

## 📦 Installation

```bash
npm install react-treecraft
# or
yarn add react-treecraft
# or
pnpm add react-treecraft
```

### Import Styles
Add the base stylesheet to your application entry point (e.g., `main.tsx` or `App.tsx`):

```tsx
import 'react-treecraft/styles';
// or
import 'react-treecraft/dist/index.css';
```

---

## 🚀 Quick Start

### 1. Basic Tree

```tsx
import React from 'react';
import { TreeCraft, TreeNode } from 'react-treecraft';
import 'react-treecraft/styles';

interface OrgNode {
  name: string;
  role: string;
}

const data: TreeNode<OrgNode> = {
  id: 'ceo',
  data: { name: 'Sarah Chen', role: 'CEO' },
  children: [
    {
      id: 'cto',
      data: { name: 'Alex Rivera', role: 'CTO' },
      children: [
        { id: 'dev1', data: { name: 'Maya Patel', role: 'Frontend Lead' }, children: [] },
        { id: 'dev2', data: { name: 'Emma Wilson', role: 'Backend Lead' }, children: [] },
      ],
    },
    {
      id: 'cmo',
      data: { name: 'Taylor Kim', role: 'CMO' },
      children: [],
    },
  ],
};

export default function MyOrgTree() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <TreeCraft<OrgNode>
        data={data}
        renderNode={({ node, isRoot, isSelected }) => (
          <div style={{
            padding: '12px 20px',
            background: isRoot ? '#3b82f6' : '#1e293b',
            color: '#fff',
            borderRadius: 8,
            minWidth: 160,
            textAlign: 'center',
          }}>
            <div style={{ fontWeight: 'bold' }}>{node.data.name}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{node.data.role}</div>
          </div>
        )}
      />
    </div>
  );
}
```

---

### 2. State-Managed Tree with `useTreeCraft` Hook

```tsx
import React from 'react';
import { TreeCraft, useTreeCraft } from 'react-treecraft';
import 'react-treecraft/styles';

export default function InteractiveTree() {
  const tree = useTreeCraft({ initialData: initialData });

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, padding: 12 }}>
        <button onClick={tree.expandAll}>Expand All</button>
        <button onClick={tree.collapseAll}>Collapse All</button>
        <button onClick={() => tree.addChild('ceo', { name: 'New Executive', role: 'VP' })}>
          + Add Executive
        </button>
      </div>

      <TreeCraft
        data={tree.data}
        collapsible
        collapsedIds={tree.collapsedIds}
        onCollapseChange={(id, collapsed) => (collapsed ? tree.collapse(id) : tree.expand(id))}
        renderNode={({ node, toggleCollapse, isCollapsed, isLeaf }) => (
          <div className="card">
            <h4>{node.data.name}</h4>
            {!isLeaf && (
              <button onClick={toggleCollapse}>
                {isCollapsed ? 'Expand' : 'Collapse'}
              </button>
            )}
          </div>
        )}
      />
    </div>
  );
}
```

---

### 3. Connector Lines & Spacing Customization

All numerical and color values are passed as standard primitives (`number` for pixels/durations, and `string` for hex/CSS colors):

```tsx
<TreeCraft
  data={tree.data}
  orientation="vertical"         // 'vertical' | 'horizontal'
  connectorType="orthogonal"     // 'orthogonal' | 'curved' | 'straight'
  connectorPattern="flow"        // 'solid' | 'dashed' | 'dotted' | 'flow'
  lineColor="#6366f1"            // Any Hex, RGB, or HSL color string
  lineWidth={2}                  // Line thickness in px
  lineRadius={12}                // Corner roundness for orthogonal lines in px (0 for sharp 90°)
  nodeGap={32}                   // Sibling node side-by-side gap in px
  levelGap={48}                  // Parent-to-child level gap in px
  animationPreset="fade"         // 'fade' | 'slide' | 'zoom' | 'bounce' | 'flip' | 'blur' | 'none'
  animationDuration={250}        // Animation duration in ms
  renderNode={({ node }) => <MyCard data={node.data} />}
/>
```

---

### 4. Drag & Drop Reordering and Reparenting

```tsx
<TreeCraft
  data={tree.data}
  draggableNodes={true}
  onNodeMove={({ sourceId, targetId, position }) => {
    // position is 'inside' | 'before' | 'after'
    tree.moveNode(sourceId, targetId, position);
  }}
  canDrop={(sourceId, targetId, position) => {
    // Custom drop validator (optional)
    return targetId !== 'locked-node';
  }}
  renderNode={({ node }) => <MyCard data={node.data} />}
/>
```

---

### 5. Canvas Export (PNG / SVG / JSON) & JSON Import

Using the companion `<TreeExport />` component:

```tsx
import React, { useRef } from 'react';
import { TreeCraft, TreeExport, TreeCraftRef, useTreeCraft } from 'react-treecraft';

export default function ExportDemo() {
  const tree = useTreeCraft({ initialData });
  const treeRef = useRef<TreeCraftRef>(null);

  return (
    <div>
      <TreeExport
        treeRef={treeRef}
        data={tree.data}
        filename="org-chart"
        backgroundColor="#0f172a"
        onExport={(format) => console.log(`Exported as ${format}`)}
        onImport={(importedData) => tree.setData(importedData)}
      />

      <TreeCraft
        ref={treeRef}
        data={tree.data}
        renderNode={({ node }) => <MyCard data={node.data} />}
      />
    </div>
  );
}
```

Or trigger exports programmatically via the ref:

```tsx
await treeRef.current?.downloadPng('my-tree.png', { scale: 3, backgroundColor: '#ffffff' });
await treeRef.current?.downloadSvg('my-tree.svg');
treeRef.current?.downloadJson('my-tree.json');
```

---

## 📖 API Reference

### `<TreeCraft<T> />` Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` **(required)** | `TreeNode<T> \| TreeNode<T>[]` | — | Root node or array of root nodes (forest) |
| `renderNode` **(required)** | `(props: RenderNodeProps<T>) => ReactNode` | — | Custom JSX render function for each node |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Tree layout flow direction |
| `connectorType` | `'orthogonal' \| 'curved' \| 'straight'` | `'orthogonal'` | SVG connector line routing style |
| `connectorPattern` | `'solid' \| 'dashed' \| 'dotted' \| 'flow'` | `'solid'` | Stroke pattern style |
| `lineColor` | `string` | `'#94a3b8'` | Connector stroke color (hex or CSS color string) |
| `lineWidth` | `number` | `2` | Connector line thickness in pixels |
| `lineRadius` | `number` | `8` | Corner radius for orthogonal connector lines (in pixels; `0` = sharp right angle) |
| `nodeGap` | `number` | `24` | Spacing between side-by-side sibling nodes (in pixels) |
| `levelGap` | `number` | `36` | Spacing between parent and child levels (in pixels) |
| `highlightColor` | `string` | `'#3b82f6'` | Highlight color for selected/focused ancestor paths |
| `collapsible` | `boolean` | `true` | Enable or disable collapsible subtrees |
| `defaultCollapsed` | `boolean` | `false` | When true, nodes start collapsed by default |
| `collapsedIds` | `Set<string> \| string[]` | — | Controlled collapsed node IDs |
| `collapseDepth` | `number` | — | Auto-collapse nodes deeper than this depth on mount |
| `animationPreset` | `AnimationPreset` | `'fade'` | Animation style (`fade`, `slide`, `zoom`, `bounce`, `flip`, `blur`, `none`) |
| `animationDuration` | `number` | `200` | Animation duration in milliseconds |
| `selectable` | `boolean` | `false` | Allow selecting individual nodes |
| `selectPath` | `boolean` | `false` | When true, selecting a node highlights its entire ancestor path from the root |
| `draggableNodes` | `boolean` | `false` | Enable drag-and-drop node reordering and reparenting |
| `onNodeMove` | `(event: NodeMoveEvent) => void` | — | Called when a node is dragged and dropped |
| `canDrop` | `(sourceId, targetId, pos) => boolean` | — | Optional validator returning boolean to permit or forbid drop |
| `zoomable` | `boolean` | `false` | Enable scroll-to-zoom and canvas drag-to-pan |
| `miniMap` | `boolean` | `false` | Display interactive corner mini-map overview |
| `miniMapPosition` | `MiniMapPosition` | `'bottom-right'` | Corner position for mini-map |
| `readOnly` | `boolean` | `false` | Freeze user interactions while preserving visual layout |
| `theme` | `TreeCraftTheme` | — | Global theme overrides |

---

### `RenderNodeProps<T>`

What your `renderNode` callback receives:

```ts
interface RenderNodeProps<T> {
  node: TreeNode<T>;
  depth: number;                // 0 = root, 1 = first level, etc.
  isRoot: boolean;
  isLeaf: boolean;
  path: string[];               // Ancestor ID chain ['root', 'parent', 'node']
  isCollapsed: boolean;
  isSelected: boolean;
  isFocused: boolean;
  isOnHighlightedPath: boolean;
  toggleCollapse: () => void;
}
```

---

### `useTreeCraft<T>` Return API

```ts
const {
  data,               // Current tree state
  setData,            // Replace entire tree
  addChild,           // (parentId, nodeData, id?) => void
  removeNode,         // (id) => void
  updateNode,         // (id, partialData) => void
  moveNode,           // (sourceId, targetId, position) => void
  collapsedIds,       // Set<string>
  collapse,           // (id) => void
  expand,             // (id) => void
  toggleCollapse,     // (id) => void
  collapseAll,        // () => void
  expandAll,          // () => void
  selectedIds,        // Set<string>
  select,             // (id) => void
  deselect,           // (id) => void
  toggleSelect,       // (id) => void
  clearSelection,     // () => void
  find,               // (id) => TreeNode<T> | null
  getPath,            // (id) => TreeNode<T>[]
  toFlat,             // () => Array<TreeNode<T> & { parentId: string | null }>
  exportJson,         // (options?) => string
  downloadJson,       // (filename?, options?) => void
  importJson,         // (jsonString) => void
} = useTreeCraft({ initialData });
```

---

## 📄 License

MIT © [Selahadin Hamid](https://github.com/selahadin)
