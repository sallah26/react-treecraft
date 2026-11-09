//
//  react-treecraft — DOM helpers
//
/**
 * Escape a string for safe use inside a CSS attribute selector value.
 * Uses the native CSS.escape when available, with a fallback for SSR / older test DOMs.
 */
export function escapeCssValue(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  // Fallback: escape backslashes, quotes and control characters
  return value.replace(/[\\"']/g, '\\$&').replace(/[\n\r\f]/g, (c) => `\\${c.charCodeAt(0).toString(16)} `);
}

/** Attribute selector matching the rendered wrapper of a tree node. */
export function nodeSelector(nodeId: string): string {
  return `[data-tc-node-id="${escapeCssValue(nodeId)}"]`;
}

/** Find the rendered element for a node id inside a root element. */
export function queryNode(root: ParentNode | null | undefined, nodeId: string): HTMLElement | null {
  if (!root) return null;
  return root.querySelector(nodeSelector(nodeId)) as HTMLElement | null;
}

