import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  ForwardedRef,
} from 'react';
import type {
  TreeCraftProps,
  TreeCraftRef,
  PngExportOptions,
  SvgExportOptions,
  JsonExportOptions,
} from '../types';
import { TreeBranch } from './TreeBranch';
import { MiniMap } from './MiniMap';
import { annotate, toArray, collectAllIds, getPath, findNode, collectDescendantIds } from '../utils/tree-helpers';
import {
  exportToPng,
  downloadPng,
  exportToSvg,
  downloadSvg,
  exportToJson,
  downloadJson,
} from '../utils/export';
import '../styles/index.css';

function TreeCraftInternal<T = Record<string, unknown>>(
  {
    data,
    renderNode,
    // collapse
    collapsible = true,
    defaultCollapsed = false,
    collapsedIds: propCollapsedIds,
    collapseDepth,
    renderCollapseButton,
    onCollapseChange,
    // styling & connectors
    orientation = 'vertical',
    animationPreset = 'fade',
    animationDuration,
    showLines = true,
    connectorType,
    connectorPattern,
    lineColor,
    lineWidth,
    lineRadius,
    highlightColor,
    nodeGap,
    levelGap,
    theme,
    className = '',
    style,
    // features
    readOnly = false,
    selectable = false,
    selectPath = false,
    selectedIds: propSelectedIds,
    onSelect,
    onNodeClick,
    focusedNodeId,
    highlightPath,
    maxDepth,
    miniMap = false,
    miniMapPosition = 'bottom-right',
    onMiniMapPositionChange,
    miniMapBackground,
    miniMapPrimaryColor,
    miniMapBorderColor,
    miniMapNodeColor,
    // drag and drop
    draggableNodes = false,
    draggable = false,
    onNodeMove,
    canDrop,
    // zoom/pan
    zoomable = false,
  }: TreeCraftProps<T>,
  ref: ForwardedRef<TreeCraftRef>,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggable = draggableNodes || draggable;

  const resolvedConnectorType = connectorType ?? theme?.lineType ?? 'orthogonal';
  const resolvedConnectorPattern = connectorPattern ?? theme?.linePattern ?? 'solid';
  const resolvedLineColor = lineColor ?? theme?.lineColor;
  const resolvedLineWidth = lineWidth ?? theme?.lineWidth;
  const resolvedLineRadius = lineRadius ?? theme?.lineRadius ?? 8;
  const resolvedHighlightColor = highlightColor ?? theme?.highlightColor;
  const resolvedNodeGap = nodeGap ?? theme?.nodeGap;
  const resolvedLevelGap = levelGap ?? theme?.levelGap;

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
  const isControlledSelect = propSelectedIds !== undefined;
  const controlledSelectedSet = useMemo(() => {
    if (propSelectedIds === undefined) return undefined;
    return propSelectedIds instanceof Set ? propSelectedIds : new Set(propSelectedIds);
  }, [propSelectedIds]);

  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(new Set());
  const activeSelectedIds = controlledSelectedSet ?? internalSelectedIds;

  const [internalFocusedId, setInternalFocusedId] = useState<string | undefined>();
  const [internalHighlightPath, setInternalHighlightPath] = useState<string | undefined>();

  // ── Drag & Drop state ─────────────────────────────────────
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  const draggedNodeDescendants = useMemo<Set<string>>(() => {
    if (!draggedNodeId) return new Set();
    const arr = toArray(data);
    const target = findNode(arr, draggedNodeId);
    if (!target) return new Set();
    return new Set(collectDescendantIds(target));
  }, [draggedNodeId, data]);

  const handleDragStartNode = useCallback((id: string) => {
    setDraggedNodeId(id);
  }, []);

  const handleDragEndNode = useCallback(() => {
    setDraggedNodeId(null);
  }, []);

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
    const isSelected = activeSelectedIds.has(id);
    const next = new Set(activeSelectedIds);
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
        if (activeFocusedId === id) setInternalFocusedId(undefined);
      } else {
        next.add(id);
        setInternalFocusedId(id);
      }
    }
    if (!isControlledSelect) {
      setInternalSelectedIds(next);
    }
    onSelect?.([...next]);
  }, [activeSelectedIds, selectPath, isControlledSelect, onSelect, activeFocusedId]);

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

  const memoizedTranslate = useMemo(
    () => (zoomable ? { x: transform.x, y: transform.y } : undefined),
    [zoomable, transform.x, transform.y],
  );

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

  const resetView = useCallback(() => {
    transformRef.current = { scale: 1, x: 0, y: 0 };
    setTransform({ scale: 1, x: 0, y: 0 });

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.transition = 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)';
      canvas.style.transform = zoomable ? 'translate(0px, 0px) scale(1)' : '';
      setTimeout(() => {
        if (canvas) canvas.style.transition = '';
      }, 260);
    }

    const viewport = viewportRef.current;
    if (viewport && canvas) {
      const scrollX = Math.max(0, (canvas.scrollWidth - viewport.clientWidth) / 2);
      const scrollY = Math.max(0, (canvas.scrollHeight - viewport.clientHeight) / 2);
      viewport.scrollTo({
        left: scrollX,
        top: scrollY,
        behavior: 'smooth',
      });
    }
  }, [zoomable]);

  const scrollToNode = useCallback(
    (nodeId: string) => {
      const viewport = viewportRef.current;
      const canvas = canvasRef.current;
      if (!viewport) return;
      const el = viewport.querySelector(`[data-tc-node-id="${nodeId}"]`) as HTMLElement | null;
      if (!el) return;

      if (zoomable && canvas) {
        const nodeRect = el.getBoundingClientRect();
        const vRect = viewport.getBoundingClientRect();
        const deltaX = (vRect.left + vRect.width / 2) - (nodeRect.left + nodeRect.width / 2);
        const deltaY = (vRect.top + vRect.height / 2) - (nodeRect.top + nodeRect.height / 2);
        const nextX = transformRef.current.x + deltaX;
        const nextY = transformRef.current.y + deltaY;
        transformRef.current.x = nextX;
        transformRef.current.y = nextY;
        canvas.style.transition = 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)';
        canvas.style.transform = `translate(${nextX}px, ${nextY}px) scale(${transformRef.current.scale})`;
        setTransform((prev) => ({ ...prev, x: nextX, y: nextY }));
        setTimeout(() => {
          if (canvas) canvas.style.transition = '';
        }, 260);
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    },
    [zoomable],
  );

  const selectNode = useCallback(
    (nodeId: string) => {
      const arr = toArray(data);
      const chain = getPath(arr, nodeId);
      const pathIds = chain ? chain.map((n) => n.id) : [nodeId];

      if (chain && chain.length > 1) {
        const ancestorIds = chain.slice(0, -1).map((n) => n.id);
        if (!isControlledCollapse) {
          setInternalCollapsedIds((prev) => {
            const next = new Set(prev);
            ancestorIds.forEach((id) => next.delete(id));
            return next;
          });
        }
        ancestorIds.forEach((id) => onCollapseChange?.(id, false));
      }

      if (selectPath) {
        const next = new Set(pathIds);
        if (!isControlledSelect) {
          setInternalSelectedIds(next);
        }
        setInternalHighlightPath(nodeId);
        setInternalFocusedId(nodeId);
        onSelect?.([...next]);
      } else {
        const next = new Set([nodeId]);
        if (!isControlledSelect) {
          setInternalSelectedIds(next);
        }
        setInternalFocusedId(nodeId);
        onSelect?.([...next]);
      }

      setTimeout(() => {
        scrollToNode(nodeId);
      }, 50);
    },
    [data, selectPath, isControlledCollapse, isControlledSelect, onCollapseChange, onSelect, scrollToNode],
  );

  const focusNode = useCallback((nodeId: string) => {
    setInternalFocusedId(nodeId);
    setInternalHighlightPath(nodeId);
  }, []);

  // ── Imperative Ref API ─────────────────────────────────────
  useImperativeHandle(
    ref,
    () => ({
      get container() {
        return containerRef.current;
      },
      get viewport() {
        return viewportRef.current;
      },
      get canvas() {
        return canvasRef.current;
      },
      resetView,
      scrollToNode,
      selectNode,
      focusNode,
      exportPng: async (options?: PngExportOptions) => {
        const el = canvasRef.current ?? containerRef.current;
        if (!el) throw new Error('[react-treecraft] Tree DOM element not found.');
        return exportToPng(el, options);
      },
      downloadPng: async (filename?: string, options?: PngExportOptions) => {
        const el = canvasRef.current ?? containerRef.current;
        if (!el) throw new Error('[react-treecraft] Tree DOM element not found.');
        return downloadPng(el, filename, options);
      },
      exportSvg: async (options?: SvgExportOptions) => {
        const el = canvasRef.current ?? containerRef.current;
        if (!el) throw new Error('[react-treecraft] Tree DOM element not found.');
        return exportToSvg(el, options);
      },
      downloadSvg: async (filename?: string, options?: SvgExportOptions) => {
        const el = canvasRef.current ?? containerRef.current;
        if (!el) throw new Error('[react-treecraft] Tree DOM element not found.');
        return downloadSvg(el, filename, options);
      },
      exportJson: (options?: JsonExportOptions) => {
        return exportToJson(data, options);
      },
      downloadJson: (filename?: string, options?: JsonExportOptions) => {
        downloadJson(data, filename, options);
      },
    }),
    [data, scrollToNode, selectNode, focusNode],
  );

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

  const lineThemeStyle: React.CSSProperties = {
    ...(resolvedLineColor ? { '--tc-line-color': resolvedLineColor } as any : {}),
    ...(resolvedLineWidth !== undefined ? { '--tc-line-width': `${resolvedLineWidth}px` } as any : {}),
    ...(resolvedLineRadius !== undefined ? { '--tc-line-radius': `${resolvedLineRadius}px` } as any : {}),
    ...(resolvedHighlightColor ? { '--tc-focus-color': resolvedHighlightColor } as any : {}),
    ...(resolvedNodeGap !== undefined ? { '--tc-node-gap': `${resolvedNodeGap}px` } as any : {}),
    ...(resolvedLevelGap !== undefined ? { '--tc-level-gap': `${resolvedLevelGap}px` } as any : {}),
    ...(theme?.animationDuration !== undefined ? { '--tc-animation-duration': `${theme.animationDuration}ms` } as any : {}),
    ...(animationDuration !== undefined ? { '--tc-animation-duration': `${animationDuration}ms` } as any : {}),
  };

  return (
    <div
      ref={containerRef}
      className={rootClasses}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...lineThemeStyle,
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
                selectedIds={activeSelectedIds}
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
                connectorType={resolvedConnectorType}
                connectorPattern={resolvedConnectorPattern}
                lineRadius={resolvedLineRadius}
                lineColor={resolvedLineColor}
                lineWidth={resolvedLineWidth}
                highlightColor={resolvedHighlightColor}
                draggableNodes={isDraggable}
                draggedNodeId={draggedNodeId}
                draggedNodeDescendants={draggedNodeDescendants}
                onDragStartNode={handleDragStartNode}
                onDragEndNode={handleDragEndNode}
                onNodeMove={onNodeMove}
                canDrop={canDrop}
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
          selectedIds={activeSelectedIds}
          position={miniMapPosition}
          onPositionChange={onMiniMapPositionChange}
          scale={zoomable ? transform.scale : undefined}
          translate={zoomable ? memoizedTranslate : undefined}
          onNavigate={zoomable ? handleNavigate : undefined}
          primaryColor={miniMapPrimaryColor ?? theme?.miniMapPrimaryColor ?? resolvedHighlightColor}
          backgroundColor={miniMapBackground ?? theme?.miniMapBackground}
          borderColor={miniMapBorderColor ?? theme?.miniMapBorderColor}
          nodeColor={miniMapNodeColor ?? theme?.miniMapNodeColor}
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

export const TreeCraft = forwardRef(TreeCraftInternal) as <T = Record<string, unknown>>(
  props: TreeCraftProps<T> & { ref?: React.Ref<TreeCraftRef> },
) => React.ReactElement;
