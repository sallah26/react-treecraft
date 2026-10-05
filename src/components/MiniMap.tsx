// ─────────────────────────────────────────────────────────────
//  MiniMap — corner overview for large trees
// ─────────────────────────────────────────────────────────────
import React, { useRef, useEffect } from 'react';
import type { TreeNode } from '../types';
import { flattenTree } from '../utils/tree-helpers';

interface MiniMapProps<T> {
  data: TreeNode<T> | TreeNode<T>[];
  containerRef: React.RefObject<HTMLDivElement>;
  focusedNodeId?: string;
  selectedIds?: Set<string>;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

const MINI_NODE_SIZE = 6;
const MINI_GAP_X = 18;
const MINI_GAP_Y = 14;
const CANVAS_W = 160;
const CANVAS_H = 100;

export function MiniMap<T>({
  data,
  containerRef,
  focusedNodeId,
  selectedIds,
  position = 'bottom-right',
}: MiniMapProps<T>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataArr = (Array.isArray(data) ? data : [data]) as TreeNode<T>[];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Build a depth-map for positioning
    const flat = flattenTree(dataArr);
    const depthMap: Record<string, number> = {};
    const depthCount: Record<number, number> = {};

    flat.forEach((node) => {
      // count depth by traversal order
      let depth = 0;
      let parentId = node.parentId;
      while (parentId) {
        depth++;
        const parent = flat.find((n) => n.id === parentId);
        parentId = parent?.parentId ?? null;
      }
      depthMap[node.id] = depth;
      depthCount[depth] = (depthCount[depth] ?? 0) + 1;
    });

    const maxDepth = Math.max(...Object.values(depthMap), 0);
    const maxPerLevel = Math.max(...Object.values(depthCount), 1);

    const scaleX = (CANVAS_W - MINI_NODE_SIZE) / Math.max(maxPerLevel * MINI_GAP_X, 1);
    const scaleY = (CANVAS_H - MINI_NODE_SIZE) / Math.max(maxDepth * MINI_GAP_Y, 1);

    const levelIdx: Record<number, number> = {};

    flat.forEach((node) => {
      const depth = depthMap[node.id];
      levelIdx[depth] = (levelIdx[depth] ?? -1) + 1;

      const x = (levelIdx[depth] * MINI_GAP_X * scaleX) + 4;
      const y = (depth * MINI_GAP_Y * scaleY) + 4;

      ctx.fillStyle =
        node.id === focusedNodeId
          ? '#3b82f6'
          : selectedIds?.has(node.id)
          ? '#8b5cf6'
          : '#94a3b8';

      ctx.beginPath();
      ctx.arc(x + MINI_NODE_SIZE / 2, y + MINI_NODE_SIZE / 2, MINI_NODE_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [data, focusedNodeId, selectedIds]);

  const posStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 100,
    background: 'rgba(15,23,42,0.85)',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: 8,
    padding: 4,
    backdropFilter: 'blur(4px)',
    ...(position === 'bottom-right' ? { bottom: 12, right: 12 } : {}),
    ...(position === 'top-right' ? { top: 12, right: 12 } : {}),
    ...(position === 'bottom-left' ? { bottom: 12, left: 12 } : {}),
    ...(position === 'top-left' ? { top: 12, left: 12 } : {}),
  };

  return (
    <div style={posStyle} title="Mini-map overview">
      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} />
    </div>
  );
}
