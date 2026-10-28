// 
//  MiniMap — Glassmorphic interactive corner radar for trees
// 
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import type { TreeNode, MiniMapPosition, MiniMapProps } from '../types';
import { toArray } from '../utils/tree-helpers';
import { normalizeColorString, parseColorToRgba, colorWithAlpha, isLightBackground } from '../utils/color-helpers';

//  Re-export so consumers can import MiniMapProps from the component file too 
export type { MiniMapProps };

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

//  Static dark-mode fallbacks (used when no CSS var / prop is found) 
const DARK_BG_FALLBACK = 'rgba(15, 23, 42, 0.92)';
const DARK_BORDER_FALLBACK = 'rgba(255, 255, 255, 0.08)';
const DARK_PRIMARY_FALLBACK = '#60a5fa';
const DARK_NODE_FALLBACK = 'rgba(148, 163, 184, 0.7)';

/**
 * Reads the resolved value of a CSS custom property from `document.documentElement`.
 * Handles the Tailwind/shadcn convention where values may be raw numbers/percentages
 * that need to be wrapped in `hsl()`.
 */
function readCssVar(names: string[]): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const style = window.getComputedStyle(document.documentElement);
    for (const name of names) {
      const raw = style.getPropertyValue(name).trim();
      if (raw) return normalizeColorString(raw);
    }
  } catch {
    // Non-DOM environment
  }
  return null;
}

/**
 * Derives a resolved color string from:
 * 1. An explicit prop (highest priority)
 * 2. A list of CSS variable names to try in order
 * 3. A static fallback string
 */
function resolveColor(
  explicit: string | null | undefined,
  cssVars: string[],
  fallback: string,
): string {
  if (explicit) return explicit;
  const fromCss = readCssVar(cssVars);
  if (fromCss) return fromCss;
  return fallback;
}

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
  primaryColor: primaryColorProp,
  backgroundColor: backgroundColorProp,
  borderColor: borderColorProp,
  nodeColor: nodeColorProp,
  className = '',
  style,
}: MiniMapProps<T>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [minimized, setMinimized] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<{ label: string; x: number; y: number } | null>(null);
  const [viewportBox, setViewportBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const isDraggingRadar = useRef(false);

  const dataArr = useMemo(() => toArray(data), [data]);

  const tx = translate?.x;
  const ty = translate?.y;

  //  Resolve dynamic theme colors 
  // These are computed once per render but can react to CSS variable changes
  // because they derive from the live DOM via getComputedStyle.
  const resolvedBg = useMemo(
    () => resolveColor(backgroundColorProp, ['--background', '--color-background'], DARK_BG_FALLBACK),
    [backgroundColorProp],
  );

  const resolvedBorder = useMemo(
    () => resolveColor(borderColorProp, ['--border', '--color-border'], DARK_BORDER_FALLBACK),
    [borderColorProp],
  );

  const resolvedPrimary = useMemo(
    () => resolveColor(primaryColorProp, ['--primary', '--color-primary', '--tc-focus-color'], DARK_PRIMARY_FALLBACK),
    [primaryColorProp],
  );

  const resolvedNode = useMemo(
    () => resolveColor(nodeColorProp, ['--tc-line-color', '--muted-foreground'], DARK_NODE_FALLBACK),
    [nodeColorProp],
  );

  // Determine if the resolved background is light so we can adapt text/icon colors
  const isLight = useMemo(() => isLightBackground(resolvedBg), [resolvedBg]);

  //  Computed color palette 
  // From the primary color we derive:
  //   • focused node fill / stroke
  //   • highlighted path line / glow
  //   • viewport lens fill / stroke
  //   • selected node (shifted hue)
  //   • root node (same primary, slightly de-saturated)
  // From the node color we derive:
  //   • regular node fill
  //   • inactive connector line color

  const palette = useMemo(() => {
    const primary = parseColorToRgba(resolvedPrimary, { r: 96, g: 165, b: 250, a: 1 });
    const nodeDot = parseColorToRgba(resolvedNode, { r: 148, g: 163, b: 184, a: 0.7 });

    return {
      // primary-derived
      primarySolid: `rgb(${primary.r}, ${primary.g}, ${primary.b})`,
      primaryGlow12: `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.12)`,
      primaryGlow25: `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.25)`,
      primaryGlow50: `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.50)`,

      // highlighted path: shift hue slightly towards cyan (blend primary with #38bdf8)
      pathSolid: colorWithAlpha(resolvedPrimary, 0.9),
      pathGlow: `rgba(${Math.min(255, primary.r - 40)}, ${Math.min(255, primary.g + 24)}, ${Math.min(255, primary.b + 8)}, 0.25)`,

      // selected: shift towards violet
      selectedSolid: `rgba(${Math.min(255, primary.r + 70)}, ${Math.max(0, primary.g - 26)}, ${Math.min(255, primary.b + 4)}, 1)`,
      selectedGlow: `rgba(${Math.min(255, primary.r + 70)}, ${Math.max(0, primary.g - 26)}, ${Math.min(255, primary.b + 4)}, 0.25)`,

      // root: use the primary color at full opacity
      rootSolid: `rgb(${primary.r}, ${primary.g}, ${primary.b})`,
      rootRing: `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.4)`,

      // regular node dot (from nodeColor)
      regularFill: `rgba(${nodeDot.r}, ${nodeDot.g}, ${nodeDot.b}, 0.75)`,

      // connector lines (from nodeColor, very transparent)
      connectorDefault: `rgba(${nodeDot.r}, ${nodeDot.g}, ${nodeDot.b}, 0.20)`,

      // shine on focused node inner dot
      shineFill: isLight ? 'rgba(0, 0, 0, 0.6)' : '#ffffff',

      // position switcher active color
      activeRect: `rgb(${primary.r}, ${primary.g}, ${primary.b})`,
    };
  }, [resolvedPrimary, resolvedNode, isLight]);

  //  Minimap shell inline styles (background, border) 
  // We inject these so the shell always reflects the resolved colors
  // regardless of the static CSS rules in index.css.
  const shellStyle = useMemo<React.CSSProperties>(() => {
    const bgRgba = parseColorToRgba(resolvedBg, { r: 15, g: 23, b: 42, a: 1 });
    // Use the resolved bg with ~90% opacity for the glassmorphism backdrop
    const bgWithAlpha = `rgba(${bgRgba.r}, ${bgRgba.g}, ${bgRgba.b}, 0.92)`;

    const borderRgba = parseColorToRgba(resolvedBorder, { r: 255, g: 255, b: 255, a: 0.08 });
    const borderSolid = `rgba(${borderRgba.r}, ${borderRgba.g}, ${borderRgba.b}, ${Math.max(0.06, borderRgba.a)})`;

    return {
      background: bgWithAlpha,
      border: `1px solid ${borderSolid}`,
      boxShadow: `0 16px 36px rgba(${bgRgba.r}, ${bgRgba.g}, ${bgRgba.b}, 0.45), 0 0 0 1px rgba(${bgRgba.r > 128 ? 0 : 255}, ${bgRgba.r > 128 ? 0 : 255}, ${bgRgba.r > 128 ? 0 : 255}, 0.04)`,
      color: isLight ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.75)',
      ...style,
    };
  }, [resolvedBg, resolvedBorder, isLight, style]);

  // Canvas container inline style
  const canvasContainerStyle = useMemo<React.CSSProperties>(() => {
    const bgRgba = parseColorToRgba(resolvedBg, { r: 15, g: 23, b: 42, a: 1 });
    const borderRgba = parseColorToRgba(resolvedBorder, { r: 255, g: 255, b: 255, a: 0.05 });
    return {
      background: `rgba(${bgRgba.r}, ${bgRgba.g}, ${bgRgba.b}, 0.65)`,
      border: `1px solid rgba(${borderRgba.r}, ${borderRgba.g}, ${borderRgba.b}, ${Math.max(0.04, borderRgba.a * 0.6)})`,
    };
  }, [resolvedBg, resolvedBorder]);

  //  Track Container Scroll & Viewport ─
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

  //  Calculate Hierarchical Coordinates 
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

  //  Render High-DPI Canvas 
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

    //  0. Viewport Indicator Lens 
    if (viewportBox) {
      const vx = viewportBox.x * CANVAS_WIDTH;
      const vy = viewportBox.y * CANVAS_HEIGHT;
      const vw = Math.max(14, viewportBox.w * CANVAS_WIDTH);
      const vh = Math.max(14, viewportBox.h * CANVAS_HEIGHT);

      ctx.fillStyle = palette.primaryGlow12;
      ctx.fillRect(vx, vy, vw, vh);

      ctx.strokeStyle = palette.primaryGlow50;
      ctx.lineWidth = 1;
      ctx.strokeRect(vx + 0.5, vy + 0.5, vw - 1, vh - 1);
    }

    const nodeMap = new Map<string, LayoutItem<T>>();
    layoutNodes.forEach((n) => nodeMap.set(n.id, n));

    //  1. Draw Connector Lines 
    layoutNodes.forEach((parent) => {
      parent.childrenIds.forEach((childId) => {
        const child = nodeMap.get(childId);
        if (!child) return;

        const isHighlighted = highlightPathIds?.has(parent.id) && highlightPathIds?.has(child.id);

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
          ctx.strokeStyle = palette.primarySolid;
          ctx.lineWidth = 2;
          ctx.shadowColor = palette.primarySolid;
          ctx.shadowBlur = 6;
        } else {
          ctx.strokeStyle = palette.connectorDefault;
          ctx.lineWidth = 1.2;
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
    });

    //  2. Draw Nodes 
    layoutNodes.forEach((node) => {
      const isFocused = focusedNodeId === node.id;
      const isSelected = selectedIds?.has(node.id) ?? false;
      const isOnPath = highlightPathIds?.has(node.id) ?? false;

      const x = node.canvasX;
      const y = node.canvasY;

      if (isFocused) {
        // Outer pulsing focus ring using primary color
        ctx.beginPath();
        ctx.arc(x, y, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = palette.primaryGlow25;
        ctx.fill();
        ctx.strokeStyle = palette.primarySolid;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Core dot
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = palette.primarySolid;
        ctx.fill();

        // Inner shine dot
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = palette.shineFill;
        ctx.fill();
      } else if (isOnPath) {
        // Glowing path dot — slightly shifted hue from primary
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = palette.pathGlow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = palette.pathSolid;
        ctx.fill();
      } else if (isSelected) {
        // Selected dot — shifted towards violet
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = palette.selectedGlow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = palette.selectedSolid;
        ctx.fill();
      } else if (node.isRoot) {
        // Root node — uses primary color at full opacity
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = palette.rootSolid;
        ctx.fill();
        ctx.strokeStyle = palette.rootRing;
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        // Regular node — uses nodeColor
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = palette.regularFill;
        ctx.fill();
      }
    });

    ctx.restore();
  }, [layoutNodes, focusedNodeId, highlightPathIds, selectedIds, orientation, minimized, viewportBox, palette]);

  //  Panning & Navigation 
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

  //  Hover & Click Interactions 
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
      ref={rootRef}
      className={`tc-minimap ${posClass} ${minimized ? 'tc-minimap--minimized' : ''} ${className}`}
      title="Tree Radar Overview"
      style={shellStyle}
    >
      <div className="tc-minimap__header">
        <div className="tc-minimap__badge">
          <span className="tc-minimap__indicator" style={{ background: palette.primarySolid, boxShadow: `0 0 6px ${palette.primarySolid}` }} />
          <span className="tc-minimap__title" style={{ color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(148,163,184,1)' }}>MiniMap</span>
          <span
            className="tc-minimap__count"
            style={{
              color: palette.primarySolid,
              background: palette.primaryGlow12,
              border: `1px solid ${palette.primaryGlow50}`,
            }}
          >
            {totalNodes}
          </span>
        </div>

        <div className="tc-minimap__actions">
          <button
            className="tc-minimap__btn"
            onClick={handleCyclePosition}
            title={`Current position: ${position}. Click to move corner.`}
          >
            {/* 4-corner quadrant switcher icon — active corner uses primary color */}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1.5" y="1.5" width="3.5" height="3.5" rx="1" fill={position === 'top-left' ? palette.activeRect : 'currentColor'} opacity={position === 'top-left' ? 1 : 0.4} />
              <rect x="7" y="1.5" width="3.5" height="3.5" rx="1" fill={position === 'top-right' ? palette.activeRect : 'currentColor'} opacity={position === 'top-right' ? 1 : 0.4} />
              <rect x="1.5" y="7" width="3.5" height="3.5" rx="1" fill={position === 'bottom-left' ? palette.activeRect : 'currentColor'} opacity={position === 'bottom-left' ? 1 : 0.4} />
              <rect x="7" y="7" width="3.5" height="3.5" rx="1" fill={position === 'bottom-right' ? palette.activeRect : 'currentColor'} opacity={position === 'bottom-right' ? 1 : 0.4} />
            </svg>
          </button>

          <button
            className="tc-minimap__btn"
            onClick={() => setMinimized((m) => !m)}
            title={minimized ? 'Expand Radar' : 'Minimize Radar'}
          >
            {minimized ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 5L6 9L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 7L6 3L10 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="tc-minimap__canvas-container" style={canvasContainerStyle}>
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
              style={{
                left: hoveredNode.x,
                top: hoveredNode.y,
                borderColor: palette.primaryGlow50,
              }}
            >
              {hoveredNode.label}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
