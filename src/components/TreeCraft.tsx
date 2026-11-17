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
import { queryNode, useIsomorphicLayoutEffect, TRANSFORM_EVENT } from '../utils/dom';
// Styles are NOT imported here: consumers import 'react-treecraft/styles' once.
// Importing CSS from JS made the CJS build `require()` a .css file, which crashes SSR / Jest.

interface ViewTransform {
  scale: number;
  x: number;
  y: number;
}

const IDENTITY_TRANSFORM: ViewTransform = { scale: 1, x: 0, y: 0 };
const VIEW_TRANSITION_MS = 260;
/** Idle time after the last wheel/pan event before a gesture counts as finished */
const GESTURE_SETTLE_MS = 400;
const VIEW_TRANSITION = `transform ${VIEW_TRANSITION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`;

const transformToCss = ({ scale, x, y }: ViewTransform) => `translate(${x}px, ${y}px) scale(${scale})`;

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
    ariaLabel,
    ariaLabelledBy,
    // features
    readOnly = false,
    selectable = false,
    selectPath = false,
    multiSelect = false,
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

  // Deprecation warning for draggableNodes
  useEffect(() => {
    if (!draggableNodes) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((globalThis as any).process?.env?.NODE_ENV === 'production') return;
    } catch { /* not in node */ }
    console.warn(
      '[react-treecraft] The `draggableNodes` prop is deprecated and will be removed in v1.0. Use `draggable` instead.'
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isDraggable = draggable || draggableNodes;

  const resolvedConnectorType = connectorType ?? theme?.lineType ?? 'orthogonal';
  const resolvedConnectorPattern = connectorPattern ?? theme?.linePattern ?? 'solid';
  const resolvedLineColor = lineColor ?? theme?.lineColor;
  const resolvedLineWidth = lineWidth ?? theme?.lineWidth;
  const resolvedLineRadius = lineRadius ?? theme?.lineRadius ?? 8;
  const resolvedHighlightColor = highlightColor ?? theme?.highlightColor;
  const resolvedNodeGap = nodeGap ?? theme?.nodeGap;
  const resolvedLevelGap = levelGap ?? theme?.levelGap;

  //  Initial collapsed state 
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

  //  Drag & Drop state ─
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

  const toggleSelect = useCallback((id: string, path: string[], additive: boolean) => {
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
    } else if (multiSelect && additive) {
      // Shift / Cmd / Ctrl + click: add or remove this node, keep the rest
      if (isSelected) {
        next.delete(id);
        if (activeFocusedId === id) setInternalFocusedId(undefined);
      } else {
        next.add(id);
        setInternalFocusedId(id);
      }
    } else if (isSelected && activeSelectedIds.size === 1) {
      // Plain click on the only selected node: deselect it
      next.clear();
      if (activeFocusedId === id) setInternalFocusedId(undefined);
    } else {
      // Plain click: select only this node
      next.clear();
      next.add(id);
      setInternalFocusedId(id);
    }
    if (!isControlledSelect) {
      setInternalSelectedIds(next);
    }
    onSelect?.([...next]);
  }, [activeSelectedIds, selectPath, multiSelect, isControlledSelect, onSelect, activeFocusedId]);

  //  Highlighted path 
  const highlightPathIds = useMemo<Set<string> | undefined>(() => {
    if (!activeHighlightPath) return undefined;
    const arr = toArray(data);
    const chain = getPath(arr, activeHighlightPath);
    return chain ? new Set(chain.map((n) => n.id)) : undefined;
  }, [activeHighlightPath, data]);

  //  Zoom / Pan
  // The live transform lives in `transformRef` and is written straight to the canvas element.
  // React state only mirrors it once a gesture settles (the MiniMap follows per frame through
  // TRANSFORM_EVENT instead). React never writes the transform itself, so a re-render can't put
  // back an older value mid-gesture (that was the source of the shaking), and wheel/pan events
  // don't re-render anything.
  const [transform, setTransform] = useState<ViewTransform>(IDENTITY_TRANSFORM);
  const transformRef = useRef<ViewTransform>(IDENTITY_TRANSFORM);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const syncFrameRef = useRef(0);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** Canvas layout origin (client coords, transform excluded), cached for one gesture */
  const gestureOriginRef = useRef<{ left: number; top: number } | null>(null);

  const memoizedTranslate = useMemo(
    () => (zoomable ? { x: transform.x, y: transform.y } : undefined),
    [zoomable, transform.x, transform.y],
  );

  /**
   * Apply a transform now (ref + DOM). During a gesture this is all that happens per event:
   * - the MiniMap is notified once per frame via a DOM event (no React render)
   * - React state is mirrored only once the gesture settles
   * - `tc-root--interacting` is set meanwhile (CSS pauses pointer events on the canvas, so
   *   nodes sliding under the cursor don't flip hover states mid-zoom)
   */
  const applyTransform = useCallback((next: ViewTransform, animate = false) => {
    transformRef.current = next;
    const canvas = canvasRef.current;
    const root = containerRef.current;
    if (canvas) {
      // A gesture interrupts any running programmatic animation immediately
      canvas.style.transition = animate ? VIEW_TRANSITION : '';
      canvas.style.transform = transformToCss(next);
      // GPU layer for the whole gesture; dropped once settled so text re-rasterizes crisply
      canvas.style.willChange = 'transform';
    }
    root?.classList.add('tc-root--interacting');

    if (!syncFrameRef.current) {
      syncFrameRef.current = requestAnimationFrame(() => {
        syncFrameRef.current = 0;
        viewportRef.current?.dispatchEvent(new Event(TRANSFORM_EVENT));
      });
    }

    clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      if (canvas) {
        canvas.style.willChange = '';
        canvas.style.transition = '';
      }
      root?.classList.remove('tc-root--interacting');
      gestureOriginRef.current = null;
      setTransform(transformRef.current);
    }, animate ? VIEW_TRANSITION_MS + 40 : GESTURE_SETTLE_MS);
  }, []);

  // Cancel pending frame / timers on unmount
  useEffect(
    () => () => {
      cancelAnimationFrame(syncFrameRef.current);
      clearTimeout(settleTimerRef.current);
    },
    [],
  );

  // Entering zoom mode applies the current transform; leaving it resets everything
  useIsomorphicLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (zoomable) {
      if (canvas) canvas.style.transform = transformToCss(transformRef.current);
      return;
    }
    clearTimeout(settleTimerRef.current);
    gestureOriginRef.current = null;
    containerRef.current?.classList.remove('tc-root--interacting');
    transformRef.current = IDENTITY_TRANSFORM;
    setTransform(IDENTITY_TRANSFORM);
    if (canvas) {
      canvas.style.transform = '';
      canvas.style.willChange = '';
      canvas.style.transition = '';
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

      const { scale: currentScale, x: currentX, y: currentY } = transformRef.current;
      // Normalize line/page wheel units (Firefox) to pixels and cap huge single jumps
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      const deltaY = Math.max(-300, Math.min(300, e.deltaY * unit));
      const nextScale = Math.min(4, Math.max(0.15, currentScale * Math.exp(-deltaY * 0.0015)));
      if (nextScale === currentScale) return;
      const ratio = nextScale / currentScale;

      // Measure the canvas origin once per gesture, not on every wheel event (each read right
      // after a transform write forced a synchronous style/layout pass mid-frame)
      if (!gestureOriginRef.current) {
        canvas.style.transition = ''; // jump any running animation to its end before measuring
        const rect = canvas.getBoundingClientRect();
        gestureOriginRef.current = { left: rect.left - currentX, top: rect.top - currentY };
      }

      // Keep the point under the cursor fixed (transform-origin is 0 0)
      const cursorCanvasX = e.clientX - (gestureOriginRef.current.left + currentX);
      const cursorCanvasY = e.clientY - (gestureOriginRef.current.top + currentY);

      applyTransform({
        scale: nextScale,
        x: currentX + cursorCanvasX * (1 - ratio),
        y: currentY + cursorCanvasY * (1 - ratio),
      });
    };

    viewport.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      viewport.removeEventListener('wheel', handleWheelNative);
    };
  }, [zoomable, applyTransform]);

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

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning.current) return;
      applyTransform({
        scale: transformRef.current.scale,
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      });
    },
    [applyTransform],
  );

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const handleNavigate = useCallback(
    (ratioX: number, ratioY: number) => {
      const canvas = canvasRef.current;
      const viewport = viewportRef.current;
      if (!canvas || !viewport) return;

      const { scale: currentScale, x: currentX, y: currentY } = transformRef.current;
      const vRect = viewport.getBoundingClientRect();
      const cRect = canvas.getBoundingClientRect();

      const layoutLeft = (cRect.left - vRect.left) - currentX;
      const layoutTop = (cRect.top - vRect.top) - currentY;

      applyTransform({
        scale: currentScale,
        x: (vRect.width / 2) - layoutLeft - ratioX * canvas.offsetWidth * currentScale,
        y: (vRect.height / 2) - layoutTop - ratioY * canvas.offsetHeight * currentScale,
      });
    },
    [applyTransform],
  );

  const resetView = useCallback(() => {
    const canvas = canvasRef.current;
    if (zoomable) {
      applyTransform(IDENTITY_TRANSFORM, true);
    } else {
      transformRef.current = IDENTITY_TRANSFORM;
      setTransform(IDENTITY_TRANSFORM);
    }

    const viewport = viewportRef.current;
    if (viewport && canvas) {
      viewport.scrollTo({
        left: Math.max(0, (canvas.scrollWidth - viewport.clientWidth) / 2),
        top: Math.max(0, (canvas.scrollHeight - viewport.clientHeight) / 2),
        behavior: 'smooth',
      });
    }
  }, [zoomable, applyTransform]);

  const scrollToNode = useCallback(
    (nodeId: string) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const el = queryNode(viewport, nodeId);
      if (!el) return;

      if (zoomable && canvasRef.current) {
        const nodeRect = el.getBoundingClientRect();
        const vRect = viewport.getBoundingClientRect();
        const deltaX = (vRect.left + vRect.width / 2) - (nodeRect.left + nodeRect.width / 2);
        const deltaY = (vRect.top + vRect.height / 2) - (nodeRect.top + nodeRect.height / 2);
        const current = transformRef.current;
        applyTransform({ scale: current.scale, x: current.x + deltaX, y: current.y + deltaY }, true);
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    },
    [zoomable, applyTransform],
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

  //  Imperative Ref API ─
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

  //  Annotate data 
  const annotatedNodes = useMemo(() => annotate(toArray(data)), [data]);

  const rootClasses = [
    'tc-root',
    orientation === 'horizontal' ? 'tc-root--horizontal' : '',
    className,
  ].filter(Boolean).join(' ');

  // `transform` itself is applied imperatively (see applyTransform), never by React
  const innerStyle: React.CSSProperties = zoomable
    ? {
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
          <div
            className={annotatedNodes.length > 1 ? 'tc-forest' : 'tc-tree-wrapper'}
            role="tree"
            aria-label={ariaLabel ?? (annotatedNodes.length > 1 ? 'Hierarchical forest' : 'Hierarchical tree')}
            aria-labelledby={ariaLabelledBy}
            aria-multiselectable={selectable && multiSelect && !selectPath ? true : undefined}
          >
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
            // TreeCraft owns navigation: transform in zoom mode, scroll otherwise.
            scrollToNode(node.id);
          }}
        />
      )}
    </div>
  );
}

export const TreeCraft = forwardRef(TreeCraftInternal) as <T = Record<string, unknown>>(
  props: TreeCraftProps<T> & { ref?: React.Ref<TreeCraftRef> },
) => React.ReactElement;
