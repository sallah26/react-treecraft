// ─────────────────────────────────────────────────────────────
//  TreeCraft — main orchestrator component
// ─────────────────────────────────────────────────────────────
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { TreeCraftProps } from '../types';
import { TreeBranch } from './TreeBranch';
import { MiniMap } from './MiniMap';
import { annotate, toArray, collectAllIds, getPath } from '../utils/tree-helpers';
import '../styles/index.css';

export function TreeCraft<T = Record<string, unknown>>({
  data,
  renderNode,
  // collapse
  collapsible = true,
  defaultCollapsed = false,
  collapsedIds: propCollapsedIds,
  collapseDepth,
  renderCollapseButton,
  onCollapseChange,
  // styling
  orientation = 'vertical',
  animationPreset = 'fade',
  animationDuration,
  className = '',
  style,
  // features
  readOnly = false,
  selectable = false,
  selectPath = false,
  onSelect,
  onNodeClick,
  focusedNodeId,
  highlightPath,
  maxDepth,
  miniMap = false,
  miniMapPosition = 'bottom-right',
  onMiniMapPositionChange,
  // zoom/pan
  zoomable = false,
}: TreeCraftProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Initial collapsed state ────────────────────────────────
  const initCollapsedIds = useMemo<Set<string>>(() => {
    const arr = toArray(data);
    const all = collectAllIds(arr);
    if (collapseDepth !== undefined) {
      const annotated = annotate(arr);
      const flat: Array<{ id: string; _depth: number }> = [];
      function walk(nodes: typeof annotated) {
        nodes.forEach((n) => { flat.push({ id: n.id, _depth: n._depth }); walk(n.children as typeof annotated ?? []); });
      }
      walk(annotated);
      return new Set(flat.filter((n) => n._depth >= collapseDepth!).map((n) => n.id));
    }
    if (defaultCollapsed) return new Set(all);
    return new Set<string>();
  }, []); // intentionally only on mount

  const isControlledCollapse = propCollapsedIds !== undefined;
  const controlledCollapsedSet = useMemo(() => {
    if (propCollapsedIds === undefined) return undefined;
    return propCollapsedIds instanceof Set ? propCollapsedIds : new Set(propCollapsedIds);
  }, [propCollapsedIds]);

  const [internalCollapsedIds, setInternalCollapsedIds] = useState<Set<string>>(initCollapsedIds);

  const activeCollapsedIds = controlledCollapsedSet ?? internalCollapsedIds;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [internalFocusedId, setInternalFocusedId] = useState<string | undefined>();
  const [internalHighlightPath, setInternalHighlightPath] = useState<string | undefined>();

  const activeFocusedId = focusedNodeId !== undefined ? focusedNodeId : internalFocusedId;
  const activeHighlightPath = highlightPath !== undefined ? highlightPath : internalHighlightPath;

  const toggleCollapse = useCallback((id: string) => {
    if (!isControlledCollapse) {
      setInternalCollapsedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    }
  }, [isControlledCollapse]);

  const toggleSelect = useCallback((id: string, path: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const isSelected = next.has(id);
      if (selectPath) {
        if (isSelected) {
          // Deselect the node and its entire ancestor chain
          path.forEach((ancestorId) => next.delete(ancestorId));
          setInternalHighlightPath(undefined);
          setInternalFocusedId(undefined);
        } else {
          // Select this specific path (clear old path)
          next.clear();
          path.forEach((ancestorId) => next.add(ancestorId));
          setInternalHighlightPath(id);
          setInternalFocusedId(id);
        }
      } else {
        // Individual node toggle
        if (isSelected) {
          next.delete(id);
        } else {
          next.add(id);
        }
      }
      onSelect?.([...next]);
      return next;
    });
  }, [selectPath, onSelect]);

  // ── Highlighted path ──────────────────────────────────────
  const highlightPathIds = useMemo<Set<string> | undefined>(() => {
    if (!activeHighlightPath) return undefined;
    const arr = toArray(data);
    const chain = getPath(arr, activeHighlightPath);
    return chain ? new Set(chain.map((n) => n.id)) : undefined;
  }, [activeHighlightPath, data]);

  // ── Zoom / Pan ────────────────────────────────────────────
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const transformRef = useRef({ scale: 1, x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Keep transformRef in sync
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  // Reset when zoomable changes
  useEffect(() => {
    if (!zoomable) {
      transformRef.current = { scale: 1, x: 0, y: 0 };
      setTransform({ scale: 1, x: 0, y: 0 });
      if (canvasRef.current) {
        canvasRef.current.style.transform = '';
      }
    }
  }, [zoomable]);

  useEffect(() => {
    if (!zoomable) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const currentScale = transformRef.current.scale;
      const currentX = transformRef.current.x;
      const currentY = transformRef.current.y;

      const scaleMultiplier = Math.exp(-e.deltaY * 0.0015);
      const nextScale = Math.min(4, Math.max(0.15, currentScale * scaleMultiplier));
      if (nextScale === currentScale) return;
      const ratio = nextScale / currentScale;

      // Cursor position relative to the currently rendered canvas bounds
      const canvasRect = canvas.getBoundingClientRect();
      const cursorCanvasX = e.clientX - canvasRect.left;
      const cursorCanvasY = e.clientY - canvasRect.top;

      const nextX = currentX + cursorCanvasX * (1 - ratio);
      const nextY = currentY + cursorCanvasY * (1 - ratio);

      transformRef.current = { scale: nextScale, x: nextX, y: nextY };
      canvas.style.transform = `translate(${nextX}px, ${nextY}px) scale(${nextScale})`;
      setTransform({ scale: nextScale, x: nextX, y: nextY });
    };

    viewport.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      viewport.removeEventListener('wheel', handleWheelNative);
    };
  }, [zoomable]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!zoomable || e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest('button, input, select, textarea, a')) return;

      isPanning.current = true;
      panStart.current = {
        x: e.clientX - transformRef.current.x,
        y: e.clientY - transformRef.current.y,
      };
    },
    [zoomable],
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const canvas = canvasRef.current;
    const nextX = e.clientX - panStart.current.x;
    const nextY = e.clientY - panStart.current.y;
    transformRef.current.x = nextX;
    transformRef.current.y = nextY;
    if (canvas) {
      canvas.style.transform = `translate(${nextX}px, ${nextY}px) scale(${transformRef.current.scale})`;
    }
    setTransform((prev) => ({ ...prev, x: nextX, y: nextY }));
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const handleNavigate = useCallback((ratioX: number, ratioY: number) => {
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    if (!canvas || !viewport) return;

    const currentScale = transformRef.current.scale;
    const vRect = viewport.getBoundingClientRect();
    const cRect = canvas.getBoundingClientRect();

    const layoutLeft = (cRect.left - vRect.left) - transformRef.current.x;
    const layoutTop = (cRect.top - vRect.top) - transformRef.current.y;

    const cWidth = canvas.offsetWidth;
    const cHeight = canvas.offsetHeight;

    const nextX = (vRect.width / 2) - layoutLeft - ratioX * cWidth * currentScale;
    const nextY = (vRect.height / 2) - layoutTop - ratioY * cHeight * currentScale;

    transformRef.current = { scale: currentScale, x: nextX, y: nextY };
    canvas.style.transform = `translate(${nextX}px, ${nextY}px) scale(${currentScale})`;
    setTransform({ scale: currentScale, x: nextX, y: nextY });
  }, []);

  // ── Annotate data ─────────────────────────────────────────
  const annotatedNodes = useMemo(() => annotate(toArray(data)), [data]);

  const rootClasses = [
    'tc-root',
    orientation === 'horizontal' ? 'tc-root--horizontal' : '',
    className,
  ].filter(Boolean).join(' ');

  const innerStyle: React.CSSProperties = zoomable
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        transformOrigin: '0 0',
        cursor: isPanning.current ? 'grabbing' : 'grab',
      }
    : {};

  const durationStyle = animationDuration !== undefined
    ? { '--tc-animation-duration': `${animationDuration}ms` } as React.CSSProperties
    : {};

  return (
    <div
      ref={containerRef}
      className={rootClasses}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...durationStyle,
        ...style,
      }}
    >
      <div
        ref={viewportRef}
        className="tc-viewport"
        style={{
          overflow: zoomable ? 'hidden' : 'auto',
          width: '100%',
          height: '100%',
        }}
        onMouseDown={zoomable ? handleMouseDown : undefined}
        onMouseMove={zoomable ? handleMouseMove : undefined}
        onMouseUp={zoomable ? handleMouseUp : undefined}
        onMouseLeave={zoomable ? handleMouseUp : undefined}
      >
        <div ref={canvasRef} className="tc-canvas" style={innerStyle}>
          <div className={annotatedNodes.length > 1 ? 'tc-forest' : 'tc-tree-wrapper'}>
            {annotatedNodes.map((node) => (
              <TreeBranch
                key={node.id}
                node={node}
                collapsedIds={activeCollapsedIds}
                selectedIds={selectedIds}
                focusedNodeId={activeFocusedId}
                highlightPathIds={highlightPathIds}
                collapsible={collapsible}
                selectable={selectable}
                selectPath={selectPath}
                readOnly={readOnly}
                orientation={orientation}
                animationPreset={animationPreset}
                maxDepth={maxDepth}
                renderNode={renderNode}
                renderCollapseButton={renderCollapseButton}
                onCollapseChange={onCollapseChange}
                onSelect={onSelect}
                onNodeClick={onNodeClick}
                onToggleCollapse={toggleCollapse}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        </div>
      </div>

      {miniMap && (
        <MiniMap
          data={data}
          containerRef={viewportRef}
          orientation={orientation}
          focusedNodeId={activeFocusedId}
          highlightPathIds={highlightPathIds}
          selectedIds={selectedIds}
          position={miniMapPosition}
          onPositionChange={onMiniMapPositionChange}
          scale={zoomable ? transform.scale : undefined}
          translate={zoomable ? { x: transform.x, y: transform.y } : undefined}
          onNavigate={zoomable ? handleNavigate : undefined}
          onNodeClick={(node) => {
            onNodeClick?.(node);
            const el = viewportRef.current?.querySelector(`[data-tc-node-id="${node.id}"]`) as HTMLElement | null;
            if (el) {
              if (zoomable) {
                const canvas = canvasRef.current;
                const viewport = viewportRef.current;
                if (canvas && viewport) {
                  const nodeRect = el.getBoundingClientRect();
                  const vRect = viewport.getBoundingClientRect();
                  const deltaX = (vRect.left + vRect.width / 2) - (nodeRect.left + nodeRect.width / 2);
                  const deltaY = (vRect.top + vRect.height / 2) - (nodeRect.top + nodeRect.height / 2);
                  const nextX = transformRef.current.x + deltaX;
                  const nextY = transformRef.current.y + deltaY;
                  transformRef.current.x = nextX;
                  transformRef.current.y = nextY;
                  canvas.style.transform = `translate(${nextX}px, ${nextY}px) scale(${transformRef.current.scale})`;
                  setTransform((prev) => ({ ...prev, x: nextX, y: nextY }));
                }
              } else {
                el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
              }
            }
          }}
        />
      )}
    </div>
  );
}
