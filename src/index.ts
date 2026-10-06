// ─────────────────────────────────────────────────────────────
//  react-treecraft — Public API
// ─────────────────────────────────────────────────────────────

// Main component
export { TreeCraft } from './components/TreeCraft';

// Optional companion components
export { TreeSearch } from './components/TreeSearch';
export { MiniMap } from './components/MiniMap';
export { DefaultCollapseBtn } from './components/DefaultCollapseBtn';
export { TreeConnector } from './components/TreeConnector';

// State management hook
export { useTreeCraft } from './hooks/useTreeCraft';

// Utility functions (tree-helpers) — power users can import directly
export {
  generateId,
  toArray,
  annotate,
  findNode,
  getPath,
  collectDescendantIds,
  collectAllIds,
  addChildNode,
  removeNode,
  updateNodeData,
  moveNode,
  flattenTree,
  buildTree,
} from './utils/tree-helpers';

// Full TypeScript types
export type {
  TreeNode,
  InternalNode,
  RenderNodeProps,
  RenderCollapseBtnProps,
  TreeCraftProps,
  UseTreeCraftOptions,
  UseTreeCraftReturn,
} from './types';
