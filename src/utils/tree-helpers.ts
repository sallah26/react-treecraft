// ─────────────────────────────────────────────────────────────
//  react-treecraft — Pure Tree Utility Functions
// ─────────────────────────────────────────────────────────────
import type { TreeNode, InternalNode } from '../types';

/** Generate a collision-resistant id */
export function generateId(): string {
  return `tc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Normalise: single root or forest → always work internally as an array */
export function toArray<T>(data: TreeNode<T> | TreeNode<T>[]): TreeNode<T>[] {
  return Array.isArray(data) ? data : [data];
}

/** Annotate every node with depth / isRoot / isLeaf / path metadata */
export function annotate<T>(
  nodes: TreeNode<T>[],
  depth = 0,
  path: string[] = [],
): InternalNode<T>[] {
  return nodes.map((node) => {
    const myPath = [...path, node.id];
    const children = annotate(node.children ?? [], depth + 1, myPath);
    return {
      ...node,
      children,
      _depth: depth,
      _isRoot: depth === 0,
      _isLeaf: (node.children ?? []).length === 0,
      _path: myPath,
    } as InternalNode<T>;
  });
}

/** Find a node by id — returns null if not found */
export function findNode<T>(
  nodes: TreeNode<T>[],
  id: string,
): TreeNode<T> | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children ?? [], id);
    if (found) return found;
  }
  return null;
}

/** Get the ancestor chain from the root down to targetId (inclusive) */
export function getPath<T>(
  nodes: TreeNode<T>[],
  targetId: string,
  ancestors: TreeNode<T>[] = [],
): TreeNode<T>[] | null {
  for (const node of nodes) {
    const chain = [...ancestors, node];
    if (node.id === targetId) return chain;
    const found = getPath(node.children ?? [], targetId, chain);
    if (found) return found;
  }
  return null;
}

/** Collect all descendant ids of a node (including itself) */
export function collectDescendantIds<T>(node: TreeNode<T>): string[] {
  return [
    node.id,
    ...(node.children ?? []).flatMap(collectDescendantIds),
  ];
}

/** Collect all ids in a tree */
export function collectAllIds<T>(nodes: TreeNode<T>[]): string[] {
  return nodes.flatMap((n) => collectDescendantIds(n));
}

/** Immutable: add a child node under parentId */
export function addChildNode<T>(
  nodes: TreeNode<T>[],
  parentId: string,
  newNode: TreeNode<T>,
): TreeNode<T>[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...(node.children ?? []), newNode] };
    }
    return {
      ...node,
      children: addChildNode(node.children ?? [], parentId, newNode),
    };
  });
}

/** Immutable: remove a node and all its descendants */
export function removeNode<T>(
  nodes: TreeNode<T>[],
  id: string,
): TreeNode<T>[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => ({ ...n, children: removeNode(n.children ?? [], id) }));
}

/** Immutable: shallow-merge partialData into a node's data */
export function updateNodeData<T>(
  nodes: TreeNode<T>[],
  id: string,
  partial: Partial<T>,
): TreeNode<T>[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, data: { ...node.data, ...partial } };
    }
    return {
      ...node,
      children: updateNodeData(node.children ?? [], id, partial),
    };
  });
}

/** Immutable: move nodeId to be a child of newParentId */
export function moveNode<T>(
  nodes: TreeNode<T>[],
  nodeId: string,
  newParentId: string,
): TreeNode<T>[] {
  const target = findNode(nodes, nodeId);
  if (!target) return nodes;

  // prevent moving a node into one of its own descendants
  const descendantIds = new Set(collectDescendantIds(target));
  if (descendantIds.has(newParentId)) {
    console.warn('[react-treecraft] Cannot move a node into its own descendant.');
    return nodes;
  }

  const stripped = removeNode(nodes, nodeId);
  return addChildNode(stripped, newParentId, target);
}

/** Flatten a tree → array of { ...node, parentId } */
export function flattenTree<T>(
  nodes: TreeNode<T>[],
  parentId: string | null = null,
): Array<TreeNode<T> & { parentId: string | null }> {
  return nodes.flatMap((node) => [
    { ...node, children: [], parentId },
    ...flattenTree(node.children ?? [], node.id),
  ]);
}

/** Build a tree from a flat list — each item must have { id, parentId } */
export function buildTree<T extends { id: string }>(
  flat: Array<T & { parentId: string | null }>,
): TreeNode<T>[] {
  const map = new Map<string, TreeNode<T>>();
  const roots: TreeNode<T>[] = [];

  for (const item of flat) {
    map.set(item.id, { id: item.id, data: item, children: [] });
  }
  for (const item of flat) {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
