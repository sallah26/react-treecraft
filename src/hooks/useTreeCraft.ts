// ─────────────────────────────────────────────────────────────
//  react-treecraft — useTreeCraft Hook
//  The built-in state manager. Zero boilerplate for consumers.
// ─────────────────────────────────────────────────────────────
import { useState, useCallback } from 'react';
import type { TreeNode, UseTreeCraftOptions, UseTreeCraftReturn, DropPosition } from '../types';
import {
  toArray,
  generateId,
  findNode,
  getPath,
  addChildNode,
  removeNode as removeNodeUtil,
  updateNodeData,
  moveNode as moveNodeUtil,
  flattenTree,
  collectAllIds,
} from '../utils/tree-helpers';

export function useTreeCraft<T = Record<string, unknown>>(
  options: UseTreeCraftOptions<T>,
): UseTreeCraftReturn<T> {
  const [data, setData] = useState<TreeNode<T> | TreeNode<T>[]>(options.initialData);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const nodes = useCallback(() => toArray(data), [data]);
  const isForest = Array.isArray(data);

  // ── Tree Mutations ──────────────────────────────────────────────────────

  const addChild = useCallback(
    (parentId: string, nodeData: T, id?: string) => {
      const newNode: TreeNode<T> = { id: id ?? generateId(), data: nodeData, children: [] };
      setData((prev) => {
        const arr = toArray(prev);
        const updated = addChildNode(arr, parentId, newNode);
        return isForest ? updated : updated[0];
      });
    },
    [isForest],
  );

  const removeNode = useCallback(
    (id: string) => {
      setData((prev) => {
        const arr = toArray(prev);
        const updated = removeNodeUtil(arr, id);
        return isForest ? updated : updated[0] ?? prev;
      });
      // clean up collapsed/selected state for removed node
      setCollapsedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    },
    [isForest],
  );

  const updateNode = useCallback(
    (id: string, partialData: Partial<T>) => {
      setData((prev) => {
        const arr = toArray(prev);
        const updated = updateNodeData(arr, id, partialData);
        return isForest ? updated : updated[0];
      });
    },
    [isForest],
  );

  const moveNode = useCallback(
    (nodeId: string, targetId: string, position: DropPosition = 'inside') => {
      setData((prev) => {
        const arr = toArray(prev);
        const updated = moveNodeUtil(arr, nodeId, targetId, position);
        return isForest ? updated : updated[0] ?? prev;
      });
    },
    [isForest],
  );

  // ── Collapse Controls ───────────────────────────────────────────────────

  const collapse = useCallback((id: string) => {
    setCollapsedIds((prev) => new Set(prev).add(id));
  }, []);

  const expand = useCallback((id: string) => {
    setCollapsedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }, []);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => {
    setCollapsedIds(new Set(collectAllIds(nodes())));
  }, [nodes]);

  const expandAll = useCallback(() => {
    setCollapsedIds(new Set());
  }, []);

  // ── Selection Controls ──────────────────────────────────────────────────

  const select = useCallback((id: string) => {
    setSelectedIds((prev) => new Set(prev).add(id));
  }, []);

  const deselect = useCallback((id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // ── Queries ─────────────────────────────────────────────────────────────

  const find = useCallback(
    (id: string): TreeNode<T> | null => findNode(nodes(), id),
    [nodes],
  );

  const getPathFn = useCallback(
    (id: string): TreeNode<T>[] => getPath(nodes(), id) ?? [],
    [nodes],
  );

  const toFlat = useCallback(
    () => flattenTree(nodes()),
    [nodes],
  );

  return {
    data,
    setData,
    addChild,
    removeNode,
    updateNode,
    moveNode,
    collapsedIds,
    collapse,
    expand,
    toggleCollapse,
    collapseAll,
    expandAll,
    selectedIds,
    select,
    deselect,
    toggleSelect,
    clearSelection,
    find,
    getPath: getPathFn,
    toFlat,
  };
}
