// ─────────────────────────────────────────────────────────────
//  MiniMap — Glassmorphic interactive corner radar for trees
// ─────────────────────────────────────────────────────────────
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import type { TreeNode, MiniMapPosition } from '../types';
import { toArray } from '../utils/tree-helpers';

export interface MiniMapProps<T = Record<string, unknown>> {
  data: TreeNode<T> | TreeNode<T>[];
  containerRef?: React.RefObject<HTMLDivElement>;
  orientation?: 'vertical' | 'horizontal';
  focusedNodeId?: string;
  highlightPathIds?: Set<string>;
  selectedIds?: Set<string>;
  position?: MiniMapPosition;
  onPositionChange?: (position: MiniMapPosition) => void;
  scale?: number;
  translate?: { x: number; y: number };
  onNavigate?: (x: number, y: number) => void;
  onNodeClick?: (node: TreeNode<T>) => void;
}

interface LayoutItem<T> {
  id: string;
  node: TreeNode<T>;
  label: string;
  depth: number;
  logicalX: number;
  logicalY: number;
  canvasX: number;
  canvasY: number;
  parentId: string | null;
  childrenIds: string[];
  isRoot: boolean;
  isLeaf: boolean;
}

const CANVAS_WIDTH = 180;
const CANVAS_HEIGHT = 116;
const PADDING_X = 16;
const PADDING_Y = 16;

const POSITIONS: MiniMapPosition[] = [
  'bottom-right',
  'bottom-left',
  'top-left',
  'top-right',
];

export function MiniMap<T = Record<string, unknown>>({
  data,
  containerRef,
  orientation = 'vertical',
  focusedNodeId,
  highlightPathIds,
  selectedIds,
  position = 'bottom-right',
  onPositionChange,
  onNodeClick,
  scale,
  translate,
  onNavigate,
}: MiniMapProps<T>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [minimized, setMinimized] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<{ label: string; x: number; y: number } | null>(null);
  const [viewportBox, setViewportBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const isDraggingRadar = useRef(false);

  const dataArr = useMemo(() => toArray(data), [data]);

  const tx = translate?.x;
  const ty = translate?.y;

  // ── Track Container Scroll & Viewport ─────────────────────────
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const updateViewport = () => {
      if (scale !== undefined && tx !== undefined && ty !== undefined) {
        // Zoom/Pan mode: compute viewport radar box from canvas bounds
        const canvasEl = container.querySelector('.tc-canvas') as HTMLElement | null;
        if (!canvasEl) return;

        const cRect = canvasEl.getBoundingClientRect();
        const vRect = container.getBoundingClientRect();

        if (cRect.width <= 0 || cRect.height <= 0) return;

        const w = Math.min(1, Math.max(0.08, vRect.width / cRect.width));
        const h = Math.min(1, Math.max(0.08, vRect.height / cRect.height));

        const leftOffset = vRect.left - cRect.left;
        const topOffset = vRect.top - cRect.top;

        const x = Math.min(1 - w, Math.max(0, leftOffset / cRect.width));
        const y = Math.min(1 - h, Math.max(0, topOffset / cRect.height));

        setViewportBox((prev) => {
          if (
            prev &&
            Math.abs(prev.x - x) < 0.002 &&
            Math.abs(prev.y - y) < 0.002 &&
            Math.abs(prev.w - w) < 0.002 &&
            Math.abs(prev.h - h) < 0.002
          ) {
            return prev;
          }
          return { x, y, w, h };
        });
        return;
      }

      // Standard scroll mode
      const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = container;
      if (scrollWidth <= clientWidth + 2 && scrollHeight <= clientHeight + 2) {
        setViewportBox((prev) => (prev === null ? null : null));
        return;
      }
      const w = scrollWidth > 0 ? Math.min(1, clientWidth / scrollWidth) : 1;
      const h = scrollHeight > 0 ? Math.min(1, clientHeight / scrollHeight) : 1;
      const x = scrollWidth > 0 ? Math.min(1 - w, Math.max(0, scrollLeft / scrollWidth)) : 0;
      const y = scrollHeight > 0 ? Math.min(1 - h, Math.max(0, scrollTop / scrollHeight)) : 0;
      setViewportBox((prev) => {
        if (
          prev &&
          Math.abs(prev.x - x) < 0.002 &&
          Math.abs(prev.y - y) < 0.002 &&
          Math.abs(prev.w - w) < 0.002 &&
          Math.abs(prev.h - h) < 0.002
        ) {
          return prev;
        }
        return { x, y, w, h };
      });
    };

    updateViewport();
    container.addEventListener('scroll', updateViewport, { passive: true });
    window.addEventListener('resize', updateViewport);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateViewport);
      resizeObserver.observe(container);
    }

    return () => {
      container.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
      resizeObserver?.disconnect();
    };
  }, [containerRef, scale, tx, ty]);

  // ── Calculate Hierarchical Coordinates ───────────────────────
  const { layoutNodes, totalNodes } = useMemo(() => {
    const nodes: LayoutItem<T>[] = [];
    let leafCounter = 0;

    function getNodeLabel(n: TreeNode<T>): string {
      const d = n.data as Record<string, unknown> | undefined;
      if (!d) return n.id;
      return (d.name as string) || (d.label as string) || (d.title as string) || n.id;
    }

    interface TempNode {
      raw: TreeNode<T>;
      id: string;
      depth: number;
      parentId: string | null;
      children: TempNode[];
      leafCount: number;
      x: number;
      y: number;
    }

    function buildTemp(raw: TreeNode<T>, depth = 0, parentId: string | null = null): TempNode {
      const children = (raw.children ?? []).map((c) => buildTemp(c, depth + 1, raw.id));
      const leafCount = children.length === 0 ? 1 : children.reduce((acc, c) => acc + c.leafCount, 0);
      return { raw, id: raw.id, depth, parentId, children, leafCount, x: 0, y: 0 };
    }

    const roots = dataArr.map((r) => buildTemp(r, 0, null));

    function assignCoordinates(temp: TempNode) {
      if (temp.children.length === 0) {
        temp.x = leafCounter;
        leafCounter += 1;
      } else {
        temp.children.forEach(assignCoordinates);
        const first = temp.children[0];
        const last = temp.children[temp.children.length - 1];
        temp.x = (first.x + last.x) / 2;
      }
      temp.y = temp.depth;
    }

    roots.forEach(assignCoordinates);

    function collect(temp: TempNode) {
      const isHorizontal = orientation === 'horizontal';
      nodes.push({
        id: temp.id,
        node: temp.raw,
        label: getNodeLabel(temp.raw),
        depth: temp.depth,
        logicalX: isHorizontal ? temp.y : temp.x,
        logicalY: isHorizontal ? temp.x : temp.y,
        canvasX: 0,
        canvasY: 0,
        parentId: temp.parentId,
        childrenIds: temp.children.map((c) => c.id),
        isRoot: temp.depth === 0,
        isLeaf: temp.children.length === 0,
      });
      temp.children.forEach(collect);
    }

    roots.forEach(collect);

    if (nodes.length === 0) return { layoutNodes: [], totalNodes: 0 };

    const minX = Math.min(...nodes.map((n) => n.logicalX));
    const maxX = Math.max(...nodes.map((n) => n.logicalX));
    const minY = Math.min(...nodes.map((n) => n.logicalY));
    const maxY = Math.max(...nodes.map((n) => n.logicalY));

    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;

    const usableW = CANVAS_WIDTH - 2 * PADDING_X;
    const usableH = CANVAS_HEIGHT - 2 * PADDING_Y;

    nodes.forEach((n) => {
      n.canvasX = PADDING_X + ((n.logicalX - minX) / spanX) * usableW;
      n.canvasY = PADDING_Y + ((n.logicalY - minY) / spanY) * usableH;
    });

    return { layoutNodes: nodes, totalNodes: nodes.length };
  }, [dataArr, orientation]);

  // ── Render High-DPI Canvas ───────────────────────────────────
  useEffect(() => {
    if (minimized) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    canvas.style.width = `${CANVAS_WIDTH}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 0. Draw Viewport Indicator Lens (if scrolling active)
    if (viewportBox) {
      const vx = viewportBox.x * CANVAS_WIDTH;
      const vy = viewportBox.y * CANVAS_HEIGHT;
      const vw = Math.max(14, viewportBox.w * CANVAS_WIDTH);
      const vh = Math.max(14, viewportBox.h * CANVAS_HEIGHT);

      ctx.fillStyle = 'rgba(96, 165, 250, 0.12)';
      ctx.fillRect(vx, vy, vw, vh);

      ctx.strokeStyle = 'rgba(96, 165, 250, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(vx + 0.5, vy + 0.5, vw - 1, vh - 1);
    }

    const nodeMap = new Map<string, LayoutItem<T>>();
    layoutNodes.forEach((n) => nodeMap.set(n.id, n));

    // 1. Draw Connector Lines
    layoutNodes.forEach((parent) => {
      parent.childrenIds.forEach((childId) => {
        const child = nodeMap.get(childId);
        if (!child) return;

        const isHighlighted =
          highlightPathIds?.has(parent.id) && highlightPathIds?.has(child.id);

        ctx.beginPath();
        if (orientation === 'vertical') {
          const midY = (parent.canvasY + child.canvasY) / 2;
          ctx.moveTo(parent.canvasX, parent.canvasY);
          ctx.lineTo(parent.canvasX, midY);
          ctx.lineTo(child.canvasX, midY);
          ctx.lineTo(child.canvasX, child.canvasY);
        } else {
          const midX = (parent.canvasX + child.canvasX) / 2;
          ctx.moveTo(parent.canvasX, parent.canvasY);
          ctx.lineTo(midX, parent.canvasY);
          ctx.lineTo(midX, child.canvasY);
          ctx.lineTo(child.canvasX, child.canvasY);
        }

        if (isHighlighted) {
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#60a5fa';
          ctx.shadowBlur = 6;
        } else {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
          ctx.lineWidth = 1.2;
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
    });

    // 2. Draw Nodes
    layoutNodes.forEach((node) => {
      const isFocused = focusedNodeId === node.id;
      const isSelected = selectedIds?.has(node.id) ?? false;
      const isOnPath = highlightPathIds?.has(node.id) ?? false;

      const x = node.canvasX;
      const y = node.canvasY;

      if (isFocused) {
        // Outer pulsing focus ring
        ctx.beginPath();
        ctx.arc(x, y, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(96, 165, 250, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Core dot
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#60a5fa';
        ctx.fill();

        // Inner white shine
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      } else if (isOnPath) {
        // Glowing cyan path dot
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
      } else if (isSelected) {
        // Glowing violet selected dot
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(167, 139, 250, 0.25)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#a78bfa';
        ctx.fill();
      } else if (node.isRoot) {
        // Root node
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#818cf8';
        ctx.fill();
        ctx.strokeStyle = 'rgba(129, 140, 248, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        // Regular node
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
        ctx.fill();
      }
    });

    ctx.restore();
  }, [layoutNodes, focusedNodeId, highlightPathIds, selectedIds, orientation, minimized, viewportBox]);

  // ── Panning & Navigation ─────────────────────────────────────
  const panToCanvasCoords = useCallback((mouseX: number, mouseY: number, smooth = true) => {
    const container = containerRef?.current;
    if (!container) return;
    const ratioX = Math.max(0, Math.min(1, mouseX / CANVAS_WIDTH));
    const ratioY = Math.max(0, Math.min(1, mouseY / CANVAS_HEIGHT));

    if (scale !== undefined && translate !== undefined && onNavigate) {
      onNavigate(ratioX, ratioY);
      return;
    }

    const targetLeft = ratioX * container.scrollWidth - container.clientWidth / 2;
    const targetTop = ratioY * container.scrollHeight - container.clientHeight / 2;
    container.scrollTo({
      left: Math.max(0, targetLeft),
      top: Math.max(0, targetTop),
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, [containerRef, scale, translate, onNavigate]);

  // ── Hover & Click Interactions ───────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (isDraggingRadar.current) {
        panToCanvasCoords(mouseX, mouseY, false);
        return;
      }

      let found: LayoutItem<T> | null = null;
      for (const node of layoutNodes) {
        const dx = node.canvasX - mouseX;
        const dy = node.canvasY - mouseY;
        if (Math.hypot(dx, dy) <= 10) {
          found = node;
          break;
        }
      }

      if (found) {
        setHoveredNode({ label: found.label, x: found.canvasX, y: found.canvasY });
        canvas.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        canvas.style.cursor = 'crosshair';
      }
    },
    [layoutNodes, panToCanvasCoords],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if clicked a node
    let hitNode: LayoutItem<T> | null = null;
    for (const node of layoutNodes) {
      const dx = node.canvasX - mouseX;
      const dy = node.canvasY - mouseY;
      if (Math.hypot(dx, dy) <= 10) {
        hitNode = node;
        break;
      }
    }

    if (hitNode) {
      onNodeClick?.(hitNode.node);
      const container = containerRef?.current;
      if (container) {
        const el = container.querySelector(`[data-tc-node-id="${hitNode.id}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      }
    } else {
      isDraggingRadar.current = true;
      panToCanvasCoords(mouseX, mouseY, true);
    }
  }, [layoutNodes, onNodeClick, containerRef, panToCanvasCoords]);

  const handleMouseUp = useCallback(() => {
    isDraggingRadar.current = false;
  }, []);

  const handleCyclePosition = () => {
    const currentIndex = POSITIONS.indexOf(position);
    const nextPosition = POSITIONS[(currentIndex + 1) % POSITIONS.length];
    onPositionChange?.(nextPosition);
  };

  const posClass = `tc-minimap--${position}`;

  return (
    <div
      className={`tc-minimap ${posClass} ${minimized ? 'tc-minimap--minimized' : ''}`}
      title="Tree Radar Overview"
    >
      <div className="tc-minimap__header">
        <div className="tc-minimap__badge">
          <span className="tc-minimap__indicator" />
          <span className="tc-minimap__title">Radar</span>
          <span className="tc-minimap__count">{totalNodes}</span>
        </div>

        <div className="tc-minimap__actions">
          <button
            className="tc-minimap__btn"
            onClick={handleCyclePosition}
            title={`Current position: ${position}. Click to move corner.`}
          >
            {/* 4-corner quadrant switcher icon */}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1.5" y="1.5" width="3.5" height="3.5" rx="1" fill={position === 'top-left' ? '#60a5fa' : 'currentColor'} opacity={position === 'top-left' ? 1 : 0.4}/>
              <rect x="7" y="1.5" width="3.5" height="3.5" rx="1" fill={position === 'top-right' ? '#60a5fa' : 'currentColor'} opacity={position === 'top-right' ? 1 : 0.4}/>
              <rect x="1.5" y="7" width="3.5" height="3.5" rx="1" fill={position === 'bottom-left' ? '#60a5fa' : 'currentColor'} opacity={position === 'bottom-left' ? 1 : 0.4}/>
              <rect x="7" y="7" width="3.5" height="3.5" rx="1" fill={position === 'bottom-right' ? '#60a5fa' : 'currentColor'} opacity={position === 'bottom-right' ? 1 : 0.4}/>
            </svg>
          </button>

          <button
            className="tc-minimap__btn"
            onClick={() => setMinimized((m) => !m)}
            title={minimized ? 'Expand Radar' : 'Minimize Radar'}
          >
            {minimized ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 5L6 9L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 7L6 3L10 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="tc-minimap__canvas-container">
          <canvas
            ref={canvasRef}
            className="tc-minimap__canvas"
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              isDraggingRadar.current = false;
              setHoveredNode(null);
            }}
          />
          {hoveredNode && (
            <div
              className="tc-minimap__tooltip"
              style={{ left: hoveredNode.x, top: hoveredNode.y }}
            >
              {hoveredNode.label}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
