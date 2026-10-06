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

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(initCollapsedIds);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [internalFocusedId, setInternalFocusedId] = useState<string | undefined>();
  const [internalHighlightPath, setInternalHighlightPath] = useState<string | undefined>();

  const activeFocusedId = focusedNodeId !== undefined ? focusedNodeId : internalFocusedId;
  const activeHighlightPath = highlightPath !== undefined ? highlightPath : internalHighlightPath;

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

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
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!zoomable) return;
      e.preventDefault();
      setScale((s) => Math.min(3, Math.max(0.2, s - e.deltaY * 0.001)));
    },
    [zoomable],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!zoomable || e.button !== 0) return;
      isPanning.current = true;
      panStart.current = { x: e.clientX - translate.x, y: e.clientY - translate.y };
    },
    [zoomable, translate],
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    setTranslate({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
  }, []);

  const handleMouseUp = useCallback(() => { isPanning.current = false; }, []);

  // ── Annotate data ─────────────────────────────────────────
  const annotatedNodes = useMemo(() => annotate(toArray(data)), [data]);

  const rootClasses = [
    'tc-root',
    orientation === 'horizontal' ? 'tc-root--horizontal' : '',
    className,
  ].filter(Boolean).join(' ');

  const innerStyle: React.CSSProperties = zoomable
    ? {
        transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
        transformOrigin: 'center center',
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
      style={{ position: 'relative', overflow: zoomable ? 'hidden' : 'auto', ...durationStyle, ...style }}
      onWheel={zoomable ? handleWheel : undefined}
      onMouseDown={zoomable ? handleMouseDown : undefined}
      onMouseMove={zoomable ? handleMouseMove : undefined}
      onMouseUp={zoomable ? handleMouseUp : undefined}
      onMouseLeave={zoomable ? handleMouseUp : undefined}
    >
      <div className="tc-canvas" style={innerStyle}>
        <div className={annotatedNodes.length > 1 ? 'tc-forest' : 'tc-tree-wrapper'}>
          {annotatedNodes.map((node) => (
            <TreeBranch
              key={node.id}
              node={node}
              collapsedIds={collapsedIds}
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

      {miniMap && (
        <MiniMap
          data={data}
          containerRef={containerRef}
          focusedNodeId={activeFocusedId}
          selectedIds={selectedIds}
          position={miniMapPosition}
        />
      )}
    </div>
  );
}
