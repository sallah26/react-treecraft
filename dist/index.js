'use strict';

var react = require('react');
var jsxRuntime = require('react/jsx-runtime');
require('./index-2GXXQFP7.css');

// src/components/TreeCraft.tsx
function DefaultCollapseBtn({ isCollapsed, onClick, orientation = "vertical" }) {
  const expandedClass = orientation === "horizontal" ? isCollapsed ? "" : "tc-collapse-btn--expanded-h" : isCollapsed ? "" : "tc-collapse-btn--expanded";
  return /* @__PURE__ */ jsxRuntime.jsx(
    "button",
    {
      className: `tc-collapse-btn ${expandedClass}`,
      onClick,
      "aria-label": isCollapsed ? "Expand" : "Collapse",
      title: isCollapsed ? "Expand" : "Collapse",
      children: /* @__PURE__ */ jsxRuntime.jsx(
        "svg",
        {
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 2.5,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          children: /* @__PURE__ */ jsxRuntime.jsx("polyline", { points: "6 9 12 15 18 9" })
        }
      )
    }
  );
}
function TreeConnector({
  orientation,
  childrenRowRef,
  childrenNodes,
  highlightPathIds
}) {
  const containerRef = react.useRef(null);
  const [layout, setLayout] = react.useState({ parentCoord: 0, childCoords: [], width: 0, height: 0 });
  const measure = react.useCallback(() => {
    const row = childrenRowRef.current;
    const container = containerRef.current;
    if (!row || !container) return;
    const childElements = Array.from(row.children);
    if (childElements.length === 0) return;
    const width2 = container.offsetWidth || row.offsetWidth;
    const height2 = container.offsetHeight || 32;
    if (orientation === "vertical") {
      const parentCoord2 = row.offsetWidth / 2;
      const childCoords2 = childElements.map((el) => el.offsetLeft + el.offsetWidth / 2);
      setLayout({ parentCoord: parentCoord2, childCoords: childCoords2, width: width2, height: height2 });
    } else {
      const parentCoord2 = row.offsetHeight / 2;
      const childCoords2 = childElements.map((el) => el.offsetTop + el.offsetHeight / 2);
      setLayout({ parentCoord: parentCoord2, childCoords: childCoords2, width: width2, height: height2 });
    }
  }, [orientation, childrenRowRef]);
  react.useLayoutEffect(() => {
    measure();
    const row = childrenRowRef.current;
    const container = containerRef.current;
    if (!row || !container) return;
    const ro = new ResizeObserver(() => {
      measure();
    });
    ro.observe(row);
    ro.observe(container);
    Array.from(row.children).forEach((child) => ro.observe(child));
    return () => ro.disconnect();
  }, [measure, childrenNodes.length]);
  const { parentCoord, childCoords, width, height } = layout;
  if (childCoords.length === 0 || width === 0 || height === 0) {
    return /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        ref: containerRef,
        className: `tc-connector-zone tc-connector-zone--${orientation}`,
        "aria-hidden": "true"
      }
    );
  }
  if (orientation === "vertical") {
    const minX = childCoords[0];
    const maxX = childCoords[childCoords.length - 1];
    const midY = height / 2;
    let basePath2 = "";
    if (childCoords.length === 1) {
      basePath2 = `M ${parentCoord} 0 L ${childCoords[0]} ${height}`;
    } else {
      const stemsDown = childCoords.map((x) => `M ${x} ${midY} L ${x} ${height}`).join(" ");
      basePath2 = `M ${parentCoord} 0 L ${parentCoord} ${midY} M ${minX} ${midY} L ${maxX} ${midY} ${stemsDown}`;
    }
    const activeIndices2 = childrenNodes.map((child, idx) => highlightPathIds?.has(child.id) ? idx : -1).filter((idx) => idx !== -1);
    const highlightedPaths2 = activeIndices2.map((idx) => {
      const targetX = childCoords[idx];
      if (targetX === void 0) return "";
      if (childCoords.length === 1) {
        return `M ${parentCoord} 0 L ${targetX} ${height}`;
      }
      return `M ${parentCoord} 0 L ${parentCoord} ${midY} L ${targetX} ${midY} L ${targetX} ${height}`;
    }).filter(Boolean);
    return /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        ref: containerRef,
        className: "tc-connector-zone tc-connector-zone--vertical",
        "aria-hidden": "true",
        children: /* @__PURE__ */ jsxRuntime.jsxs(
          "svg",
          {
            className: "tc-connector-svg",
            style: {
              width: "100%",
              height: "100%",
              position: "absolute",
              top: 0,
              left: 0,
              overflow: "visible",
              pointerEvents: "none"
            },
            children: [
              /* @__PURE__ */ jsxRuntime.jsx(
                "path",
                {
                  d: basePath2,
                  className: "tc-line tc-line--base",
                  fill: "none",
                  strokeLinecap: "round",
                  strokeLinejoin: "round"
                }
              ),
              highlightedPaths2.map((d, i) => /* @__PURE__ */ jsxRuntime.jsx(
                "path",
                {
                  d,
                  className: "tc-line tc-line--highlighted",
                  fill: "none",
                  strokeLinecap: "round",
                  strokeLinejoin: "round"
                },
                i
              ))
            ]
          }
        )
      }
    );
  }
  const minY = childCoords[0];
  const maxY = childCoords[childCoords.length - 1];
  const midX = width / 2;
  let basePath = "";
  if (childCoords.length === 1) {
    basePath = `M 0 ${parentCoord} L ${width} ${childCoords[0]}`;
  } else {
    const stemsRight = childCoords.map((y) => `M ${midX} ${y} L ${width} ${y}`).join(" ");
    basePath = `M 0 ${parentCoord} L ${midX} ${parentCoord} M ${midX} ${minY} L ${midX} ${maxY} ${stemsRight}`;
  }
  const activeIndices = childrenNodes.map((child, idx) => highlightPathIds?.has(child.id) ? idx : -1).filter((idx) => idx !== -1);
  const highlightedPaths = activeIndices.map((idx) => {
    const targetY = childCoords[idx];
    if (targetY === void 0) return "";
    if (childCoords.length === 1) {
      return `M 0 ${parentCoord} L ${width} ${targetY}`;
    }
    return `M 0 ${parentCoord} L ${midX} ${parentCoord} L ${midX} ${targetY} L ${width} ${targetY}`;
  }).filter(Boolean);
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      ref: containerRef,
      className: "tc-connector-zone tc-connector-zone--horizontal",
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsxRuntime.jsxs(
        "svg",
        {
          className: "tc-connector-svg",
          style: {
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
            overflow: "visible",
            pointerEvents: "none"
          },
          children: [
            /* @__PURE__ */ jsxRuntime.jsx(
              "path",
              {
                d: basePath,
                className: "tc-line tc-line--base",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round"
              }
            ),
            highlightedPaths.map((d, i) => /* @__PURE__ */ jsxRuntime.jsx(
              "path",
              {
                d,
                className: "tc-line tc-line--highlighted",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round"
              },
              i
            ))
          ]
        }
      )
    }
  );
}
function TreeBranch({
  node,
  collapsedIds,
  selectedIds,
  focusedNodeId,
  highlightPathIds,
  collapsible,
  selectable,
  selectPath = false,
  readOnly,
  orientation,
  animationPreset,
  maxDepth,
  childIndex,
  renderNode,
  renderCollapseButton,
  onCollapseChange,
  onSelect,
  onNodeClick,
  onToggleCollapse,
  onToggleSelect,
  draggableNodes = false,
  draggedNodeId,
  draggedNodeDescendants,
  onDragStartNode,
  onDragEndNode,
  onNodeMove,
  canDrop
}) {
  const isCollapsed = collapsedIds.has(node.id);
  const isSelected = selectedIds.has(node.id);
  const isFocused = focusedNodeId === node.id;
  const isOnPath = highlightPathIds?.has(node.id) ?? false;
  const hasFocusPath = !!highlightPathIds && highlightPathIds.size > 0;
  const hasChildren = (node.children ?? []).length > 0;
  const depthLimited = maxDepth !== void 0 && node._depth >= maxDepth;
  const showChildren = hasChildren && !isCollapsed && !depthLimited;
  const showCollapseBtn = collapsible && hasChildren && !depthLimited && !readOnly;
  const childrenRowRef = react.useRef(null);
  const children = node.children ?? [];
  const [dropPosition, setDropPosition] = react.useState(null);
  const isDraggingThis = draggedNodeId === node.id;
  const isDropTargetInvalid = !draggedNodeId || draggedNodeId === node.id || (draggedNodeDescendants?.has(node.id) ?? false);
  const handleDragStart = (e) => {
    if (readOnly || !draggableNodes) return;
    const target = e.target;
    if (target.closest("button, input, select, textarea, a")) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    e.dataTransfer.setData("text/plain", node.id);
    e.dataTransfer.effectAllowed = "move";
    onDragStartNode?.(node.id);
  };
  const handleDragEnd = (e) => {
    e.stopPropagation();
    setDropPosition(null);
    onDragEndNode?.();
  };
  const handleDragOver = (e) => {
    if (!draggableNodes || readOnly || isDropTargetInvalid) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    let pos = "inside";
    if (orientation === "vertical") {
      const xRatio = (e.clientX - rect.left) / rect.width;
      if (xRatio < 0.25) pos = "before";
      else if (xRatio > 0.75) pos = "after";
      else pos = "inside";
    } else {
      const yRatio = (e.clientY - rect.top) / rect.height;
      if (yRatio < 0.25) pos = "before";
      else if (yRatio > 0.75) pos = "after";
      else pos = "inside";
    }
    if (canDrop && draggedNodeId && !canDrop(draggedNodeId, node.id, pos)) {
      e.dataTransfer.dropEffect = "none";
      setDropPosition(null);
      return;
    }
    e.dataTransfer.dropEffect = "move";
    setDropPosition(pos);
  };
  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropPosition(null);
    }
  };
  const handleDrop = (e) => {
    if (!draggableNodes || readOnly || isDropTargetInvalid) return;
    e.preventDefault();
    e.stopPropagation();
    const sourceId = e.dataTransfer.getData("text/plain") || draggedNodeId;
    if (sourceId && sourceId !== node.id && dropPosition) {
      if (!canDrop || canDrop(sourceId, node.id, dropPosition)) {
        onNodeMove?.({ sourceId, targetId: node.id, position: dropPosition });
      }
    }
    setDropPosition(null);
    onDragEndNode?.();
  };
  const STAGGER_MS = 60;
  const animClass = childIndex !== void 0 && animationPreset !== "none" ? `tc-anim-${animationPreset}-enter` : "";
  const animStyle = animClass ? { animationDelay: `${childIndex * STAGGER_MS}ms`, animationFillMode: "both" } : {};
  const handleCollapseClick = (e) => {
    e.stopPropagation();
    if (readOnly) return;
    onToggleCollapse(node.id);
    onCollapseChange?.(node.id, !isCollapsed);
  };
  const isClickSelectable = (selectable || selectPath) && !readOnly;
  const handleNodeClick = () => {
    if (readOnly) return;
    if (selectable || selectPath) {
      onToggleSelect(node.id, node._path);
    }
    onNodeClick?.(node);
  };
  const nodeWrapperClasses = [
    "tc-node-wrapper",
    isFocused ? "tc-node-wrapper--focused" : "",
    isSelected ? "tc-node-wrapper--selected" : "",
    isOnPath ? "tc-node-wrapper--on-path" : "",
    hasFocusPath ? "tc-has-focus-path" : "",
    draggableNodes && !readOnly ? "tc-node-card--draggable" : "",
    isDraggingThis ? "tc-node-card--dragging" : "",
    dropPosition === "inside" ? "tc-node-card--drop-inside" : ""
  ].filter(Boolean).join(" ");
  const collapseBtn = showCollapseBtn ? renderCollapseButton ? renderCollapseButton({ isCollapsed, onToggle: handleCollapseClick, node }) : /* @__PURE__ */ jsxRuntime.jsx(
    DefaultCollapseBtn,
    {
      isCollapsed,
      onClick: handleCollapseClick,
      orientation
    }
  ) : null;
  const renderedNodeContent = renderNode({
    node,
    depth: node._depth,
    isRoot: node._isRoot,
    isLeaf: node._isLeaf,
    path: node._path,
    isCollapsed,
    isSelected,
    isFocused,
    isOnHighlightedPath: isOnPath,
    toggleCollapse: () => onToggleCollapse(node.id)
  });
  const nodeCardEl = /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className: nodeWrapperClasses,
      "data-tc-node-id": node.id,
      draggable: draggableNodes && !readOnly,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      style: { position: "relative" },
      children: [
        dropPosition === "before" && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "tc-drop-indicator tc-drop-indicator--before" }),
        dropPosition === "after" && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "tc-drop-indicator tc-drop-indicator--after" }),
        /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            className: `tc-node-inner ${isClickSelectable ? "tc-node-inner--selectable" : ""}`,
            onClick: handleNodeClick,
            children: renderedNodeContent
          }
        ),
        collapseBtn
      ]
    }
  );
  if (orientation === "horizontal") {
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: `tc-branch tc-branch--horizontal ${animClass}`, style: animStyle, children: [
      nodeCardEl,
      showChildren && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "tc-subtree tc-subtree--horizontal", children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          TreeConnector,
          {
            orientation,
            childrenRowRef,
            childrenNodes: children,
            highlightPathIds
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: "tc-children-row tc-children-row--horizontal", ref: childrenRowRef, children: children.map((child, idx) => /* @__PURE__ */ jsxRuntime.jsx(
          TreeBranch,
          {
            node: child,
            childIndex: idx,
            collapsedIds,
            selectedIds,
            focusedNodeId,
            highlightPathIds,
            collapsible,
            selectable,
            selectPath,
            readOnly,
            orientation,
            animationPreset,
            maxDepth,
            renderNode,
            renderCollapseButton,
            onCollapseChange,
            onSelect,
            onNodeClick,
            onToggleCollapse,
            onToggleSelect,
            draggableNodes,
            draggedNodeId,
            draggedNodeDescendants,
            onDragStartNode,
            onDragEndNode,
            onNodeMove,
            canDrop
          },
          child.id
        )) })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: `tc-branch tc-branch--vertical ${animClass}`, style: animStyle, children: [
    nodeCardEl,
    showChildren && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "tc-subtree tc-subtree--vertical", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        TreeConnector,
        {
          orientation,
          childrenRowRef,
          childrenNodes: children,
          highlightPathIds
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "tc-children-row tc-children-row--vertical", ref: childrenRowRef, children: children.map((child, idx) => /* @__PURE__ */ jsxRuntime.jsx(
        TreeBranch,
        {
          node: child,
          childIndex: idx,
          collapsedIds,
          selectedIds,
          focusedNodeId,
          highlightPathIds,
          collapsible,
          selectable,
          selectPath,
          readOnly,
          orientation,
          animationPreset,
          maxDepth,
          renderNode,
          renderCollapseButton,
          onCollapseChange,
          onSelect,
          onNodeClick,
          onToggleCollapse,
          onToggleSelect,
          draggableNodes,
          draggedNodeId,
          draggedNodeDescendants,
          onDragStartNode,
          onDragEndNode,
          onNodeMove,
          canDrop
        },
        child.id
      )) })
    ] })
  ] });
}

// src/utils/tree-helpers.ts
function generateId() {
  return `tc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
function toArray(data) {
  return Array.isArray(data) ? data : [data];
}
function annotate(nodes, depth = 0, path = []) {
  return nodes.map((node) => {
    const myPath = [...path, node.id];
    const children = annotate(node.children ?? [], depth + 1, myPath);
    return {
      ...node,
      children,
      _depth: depth,
      _isRoot: depth === 0,
      _isLeaf: (node.children ?? []).length === 0,
      _path: myPath
    };
  });
}
function findNode(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children ?? [], id);
    if (found) return found;
  }
  return null;
}
function getPath(nodes, targetId, ancestors = []) {
  for (const node of nodes) {
    const chain = [...ancestors, node];
    if (node.id === targetId) return chain;
    const found = getPath(node.children ?? [], targetId, chain);
    if (found) return found;
  }
  return null;
}
function collectDescendantIds(node) {
  return [
    node.id,
    ...(node.children ?? []).flatMap(collectDescendantIds)
  ];
}
function collectAllIds(nodes) {
  return nodes.flatMap((n) => collectDescendantIds(n));
}
function addChildNode(nodes, parentId, newNode) {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...node.children ?? [], newNode] };
    }
    return {
      ...node,
      children: addChildNode(node.children ?? [], parentId, newNode)
    };
  });
}
function removeNode(nodes, id) {
  return nodes.filter((n) => n.id !== id).map((n) => ({ ...n, children: removeNode(n.children ?? [], id) }));
}
function updateNodeData(nodes, id, partial) {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, data: { ...node.data, ...partial } };
    }
    return {
      ...node,
      children: updateNodeData(node.children ?? [], id, partial)
    };
  });
}
function insertSiblingInArray(arr, targetId, newNode, position) {
  const index = arr.findIndex((n) => n.id === targetId);
  if (index === -1) return { updated: arr, found: false };
  const insertIndex = position === "before" ? index : index + 1;
  const next = [...arr];
  next.splice(insertIndex, 0, newNode);
  return { updated: next, found: true };
}
function insertSiblingRecursive(nodes, targetId, newNode, position) {
  const atCurrentLevel = insertSiblingInArray(nodes, targetId, newNode, position);
  if (atCurrentLevel.found) return atCurrentLevel.updated;
  return nodes.map((node) => {
    if (!node.children || node.children.length === 0) return node;
    return {
      ...node,
      children: insertSiblingRecursive(node.children, targetId, newNode, position)
    };
  });
}
function moveNode(nodes, nodeId, targetId, position = "inside") {
  if (nodeId === targetId) return nodes;
  const nodeToMove = findNode(nodes, nodeId);
  if (!nodeToMove) return nodes;
  const descendantIds = new Set(collectDescendantIds(nodeToMove));
  if (descendantIds.has(targetId)) {
    console.warn("[react-treecraft] Cannot move a node into its own descendant.");
    return nodes;
  }
  const stripped = removeNode(nodes, nodeId);
  if (position === "inside") {
    return addChildNode(stripped, targetId, nodeToMove);
  } else {
    return insertSiblingRecursive(stripped, targetId, nodeToMove, position);
  }
}
function flattenTree(nodes, parentId = null) {
  return nodes.flatMap((node) => [
    { ...node, children: [], parentId },
    ...flattenTree(node.children ?? [], node.id)
  ]);
}
function buildTree(flat) {
  const map = /* @__PURE__ */ new Map();
  const roots = [];
  for (const item of flat) {
    map.set(item.id, { id: item.id, data: item, children: [] });
  }
  for (const item of flat) {
    const node = map.get(item.id);
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
var CANVAS_WIDTH = 180;
var CANVAS_HEIGHT = 116;
var PADDING_X = 16;
var PADDING_Y = 16;
var POSITIONS = [
  "bottom-right",
  "bottom-left",
  "top-left",
  "top-right"
];
function MiniMap({
  data,
  containerRef,
  orientation = "vertical",
  focusedNodeId,
  highlightPathIds,
  selectedIds,
  position = "bottom-right",
  onPositionChange,
  onNodeClick,
  scale,
  translate,
  onNavigate
}) {
  const canvasRef = react.useRef(null);
  const [minimized, setMinimized] = react.useState(false);
  const [hoveredNode, setHoveredNode] = react.useState(null);
  const [viewportBox, setViewportBox] = react.useState(null);
  const isDraggingRadar = react.useRef(false);
  const dataArr = react.useMemo(() => toArray(data), [data]);
  react.useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;
    const updateViewport = () => {
      if (scale !== void 0 && translate !== void 0) {
        const canvasEl = container.querySelector(".tc-canvas");
        if (!canvasEl) return;
        const cRect = canvasEl.getBoundingClientRect();
        const vRect = container.getBoundingClientRect();
        if (cRect.width <= 0 || cRect.height <= 0) return;
        const w2 = Math.min(1, Math.max(0.08, vRect.width / cRect.width));
        const h2 = Math.min(1, Math.max(0.08, vRect.height / cRect.height));
        const leftOffset = vRect.left - cRect.left;
        const topOffset = vRect.top - cRect.top;
        const x2 = Math.min(1 - w2, Math.max(0, leftOffset / cRect.width));
        const y2 = Math.min(1 - h2, Math.max(0, topOffset / cRect.height));
        setViewportBox({ x: x2, y: y2, w: w2, h: h2 });
        return;
      }
      const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = container;
      if (scrollWidth <= clientWidth + 2 && scrollHeight <= clientHeight + 2) {
        setViewportBox(null);
        return;
      }
      const w = scrollWidth > 0 ? Math.min(1, clientWidth / scrollWidth) : 1;
      const h = scrollHeight > 0 ? Math.min(1, clientHeight / scrollHeight) : 1;
      const x = scrollWidth > 0 ? Math.min(1 - w, Math.max(0, scrollLeft / scrollWidth)) : 0;
      const y = scrollHeight > 0 ? Math.min(1 - h, Math.max(0, scrollTop / scrollHeight)) : 0;
      setViewportBox({ x, y, w, h });
    };
    updateViewport();
    container.addEventListener("scroll", updateViewport, { passive: true });
    window.addEventListener("resize", updateViewport);
    let resizeObserver = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateViewport);
      resizeObserver.observe(container);
    }
    return () => {
      container.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
      resizeObserver?.disconnect();
    };
  }, [containerRef, dataArr, scale, translate]);
  const { layoutNodes, totalNodes } = react.useMemo(() => {
    const nodes = [];
    let leafCounter = 0;
    function getNodeLabel(n) {
      const d = n.data;
      if (!d) return n.id;
      return d.name || d.label || d.title || n.id;
    }
    function buildTemp(raw, depth = 0, parentId = null) {
      const children = (raw.children ?? []).map((c) => buildTemp(c, depth + 1, raw.id));
      const leafCount = children.length === 0 ? 1 : children.reduce((acc, c) => acc + c.leafCount, 0);
      return { raw, id: raw.id, depth, parentId, children, leafCount, x: 0, y: 0 };
    }
    const roots = dataArr.map((r) => buildTemp(r, 0, null));
    function assignCoordinates(temp) {
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
    function collect(temp) {
      const isHorizontal = orientation === "horizontal";
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
        isLeaf: temp.children.length === 0
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
      n.canvasX = PADDING_X + (n.logicalX - minX) / spanX * usableW;
      n.canvasY = PADDING_Y + (n.logicalY - minY) / spanY * usableH;
    });
    return { layoutNodes: nodes, totalNodes: nodes.length };
  }, [dataArr, orientation]);
  react.useEffect(() => {
    if (minimized) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    canvas.style.width = `${CANVAS_WIDTH}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (viewportBox) {
      const vx = viewportBox.x * CANVAS_WIDTH;
      const vy = viewportBox.y * CANVAS_HEIGHT;
      const vw = Math.max(14, viewportBox.w * CANVAS_WIDTH);
      const vh = Math.max(14, viewportBox.h * CANVAS_HEIGHT);
      ctx.fillStyle = "rgba(96, 165, 250, 0.12)";
      ctx.fillRect(vx, vy, vw, vh);
      ctx.strokeStyle = "rgba(96, 165, 250, 0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(vx + 0.5, vy + 0.5, vw - 1, vh - 1);
    }
    const nodeMap = /* @__PURE__ */ new Map();
    layoutNodes.forEach((n) => nodeMap.set(n.id, n));
    layoutNodes.forEach((parent) => {
      parent.childrenIds.forEach((childId) => {
        const child = nodeMap.get(childId);
        if (!child) return;
        const isHighlighted = highlightPathIds?.has(parent.id) && highlightPathIds?.has(child.id);
        ctx.beginPath();
        if (orientation === "vertical") {
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
          ctx.strokeStyle = "#60a5fa";
          ctx.lineWidth = 2;
          ctx.shadowColor = "#60a5fa";
          ctx.shadowBlur = 6;
        } else {
          ctx.strokeStyle = "rgba(148, 163, 184, 0.22)";
          ctx.lineWidth = 1.2;
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
    });
    layoutNodes.forEach((node) => {
      const isFocused = focusedNodeId === node.id;
      const isSelected = selectedIds?.has(node.id) ?? false;
      const isOnPath = highlightPathIds?.has(node.id) ?? false;
      const x = node.canvasX;
      const y = node.canvasY;
      if (isFocused) {
        ctx.beginPath();
        ctx.arc(x, y, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(96, 165, 250, 0.25)";
        ctx.fill();
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#60a5fa";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      } else if (isOnPath) {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#38bdf8";
        ctx.fill();
      } else if (isSelected) {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(167, 139, 250, 0.25)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#a78bfa";
        ctx.fill();
      } else if (node.isRoot) {
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = "#818cf8";
        ctx.fill();
        ctx.strokeStyle = "rgba(129, 140, 248, 0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(148, 163, 184, 0.75)";
        ctx.fill();
      }
    });
    ctx.restore();
  }, [layoutNodes, focusedNodeId, highlightPathIds, selectedIds, orientation, minimized, viewportBox]);
  const panToCanvasCoords = react.useCallback((mouseX, mouseY, smooth = true) => {
    const container = containerRef?.current;
    if (!container) return;
    const ratioX = Math.max(0, Math.min(1, mouseX / CANVAS_WIDTH));
    const ratioY = Math.max(0, Math.min(1, mouseY / CANVAS_HEIGHT));
    if (scale !== void 0 && translate !== void 0 && onNavigate) {
      onNavigate(ratioX, ratioY);
      return;
    }
    const targetLeft = ratioX * container.scrollWidth - container.clientWidth / 2;
    const targetTop = ratioY * container.scrollHeight - container.clientHeight / 2;
    container.scrollTo({
      left: Math.max(0, targetLeft),
      top: Math.max(0, targetTop),
      behavior: smooth ? "smooth" : "auto"
    });
  }, [containerRef, scale, translate, onNavigate]);
  const handleMouseMove = react.useCallback(
    (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      if (isDraggingRadar.current) {
        panToCanvasCoords(mouseX, mouseY, false);
        return;
      }
      let found = null;
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
        canvas.style.cursor = "pointer";
      } else {
        setHoveredNode(null);
        canvas.style.cursor = "crosshair";
      }
    },
    [layoutNodes, panToCanvasCoords]
  );
  const handleMouseDown = react.useCallback((e) => {
    if (e.button !== 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    let hitNode = null;
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
          el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        }
      }
    } else {
      isDraggingRadar.current = true;
      panToCanvasCoords(mouseX, mouseY, true);
    }
  }, [layoutNodes, onNodeClick, containerRef, panToCanvasCoords]);
  const handleMouseUp = react.useCallback(() => {
    isDraggingRadar.current = false;
  }, []);
  const handleCyclePosition = () => {
    const currentIndex = POSITIONS.indexOf(position);
    const nextPosition = POSITIONS[(currentIndex + 1) % POSITIONS.length];
    onPositionChange?.(nextPosition);
  };
  const posClass = `tc-minimap--${position}`;
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className: `tc-minimap ${posClass} ${minimized ? "tc-minimap--minimized" : ""}`,
      title: "Tree Radar Overview",
      children: [
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "tc-minimap__header", children: [
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "tc-minimap__badge", children: [
            /* @__PURE__ */ jsxRuntime.jsx("span", { className: "tc-minimap__indicator" }),
            /* @__PURE__ */ jsxRuntime.jsx("span", { className: "tc-minimap__title", children: "Radar" }),
            /* @__PURE__ */ jsxRuntime.jsx("span", { className: "tc-minimap__count", children: totalNodes })
          ] }),
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "tc-minimap__actions", children: [
            /* @__PURE__ */ jsxRuntime.jsx(
              "button",
              {
                className: "tc-minimap__btn",
                onClick: handleCyclePosition,
                title: `Current position: ${position}. Click to move corner.`,
                children: /* @__PURE__ */ jsxRuntime.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: [
                  /* @__PURE__ */ jsxRuntime.jsx("rect", { x: "1.5", y: "1.5", width: "3.5", height: "3.5", rx: "1", fill: position === "top-left" ? "#60a5fa" : "currentColor", opacity: position === "top-left" ? 1 : 0.4 }),
                  /* @__PURE__ */ jsxRuntime.jsx("rect", { x: "7", y: "1.5", width: "3.5", height: "3.5", rx: "1", fill: position === "top-right" ? "#60a5fa" : "currentColor", opacity: position === "top-right" ? 1 : 0.4 }),
                  /* @__PURE__ */ jsxRuntime.jsx("rect", { x: "1.5", y: "7", width: "3.5", height: "3.5", rx: "1", fill: position === "bottom-left" ? "#60a5fa" : "currentColor", opacity: position === "bottom-left" ? 1 : 0.4 }),
                  /* @__PURE__ */ jsxRuntime.jsx("rect", { x: "7", y: "7", width: "3.5", height: "3.5", rx: "1", fill: position === "bottom-right" ? "#60a5fa" : "currentColor", opacity: position === "bottom-right" ? 1 : 0.4 })
                ] })
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsx(
              "button",
              {
                className: "tc-minimap__btn",
                onClick: () => setMinimized((m) => !m),
                title: minimized ? "Expand Radar" : "Minimize Radar",
                children: minimized ? /* @__PURE__ */ jsxRuntime.jsx("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M2 5L6 9L10 5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }) : /* @__PURE__ */ jsxRuntime.jsx("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M2 7L6 3L10 7", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) })
              }
            )
          ] })
        ] }),
        !minimized && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "tc-minimap__canvas-container", children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            "canvas",
            {
              ref: canvasRef,
              className: "tc-minimap__canvas",
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              onMouseMove: handleMouseMove,
              onMouseDown: handleMouseDown,
              onMouseUp: handleMouseUp,
              onMouseLeave: () => {
                isDraggingRadar.current = false;
                setHoveredNode(null);
              }
            }
          ),
          hoveredNode && /* @__PURE__ */ jsxRuntime.jsx(
            "div",
            {
              className: "tc-minimap__tooltip",
              style: { left: hoveredNode.x, top: hoveredNode.y },
              children: hoveredNode.label
            }
          )
        ] })
      ]
    }
  );
}

// src/utils/export.ts
function downloadFile(content, filename, mimeType = "application/octet-stream") {
  if (typeof window === "undefined") return;
  const blob = typeof content === "string" ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 200);
}
function collectDocumentStyles() {
  if (typeof document === "undefined") return "";
  const cssChunks = [];
  const rootComputed = window.getComputedStyle(document.documentElement);
  const tcVars = [];
  for (let i = 0; i < rootComputed.length; i++) {
    const prop = rootComputed[i];
    if (prop.startsWith("--tc-")) {
      tcVars.push(`${prop}: ${rootComputed.getPropertyValue(prop)};`);
    }
  }
  if (tcVars.length > 0) {
    cssChunks.push(`:root { ${tcVars.join(" ")} }`);
  }
  const styleSheets = Array.from(document.styleSheets);
  for (const sheet of styleSheets) {
    try {
      if (sheet.cssRules) {
        const rules = Array.from(sheet.cssRules);
        for (const rule of rules) {
          cssChunks.push(rule.cssText);
        }
      }
    } catch {
    }
  }
  return cssChunks.join("\n");
}
function findTreeElement(containerOrElement) {
  const treeWrapper = containerOrElement.querySelector(".tc-tree-wrapper, .tc-forest, .tc-canvas");
  return treeWrapper ?? containerOrElement;
}
async function exportToSvg(element, options = {}) {
  if (typeof window === "undefined") {
    throw new Error("[react-treecraft] SVG export requires a browser environment.");
  }
  const {
    backgroundColor = "transparent",
    padding = 32,
    title = "Tree Diagram",
    customCss = ""
  } = options;
  const target = findTreeElement(element);
  const clone = target.cloneNode(true);
  clone.style.transform = "none";
  clone.style.margin = "0";
  clone.style.position = "static";
  clone.style.left = "auto";
  clone.style.top = "auto";
  const scrollW = target.scrollWidth || target.offsetWidth || 800;
  const scrollH = target.scrollHeight || target.offsetHeight || 600;
  const contentWidth = Math.max(scrollW, target.getBoundingClientRect().width);
  const contentHeight = Math.max(scrollH, target.getBoundingClientRect().height);
  const totalWidth = Math.ceil(contentWidth + padding * 2);
  const totalHeight = Math.ceil(contentHeight + padding * 2);
  const docStyles = collectDocumentStyles();
  const allStyles = `
    ${docStyles}
    ${customCss}
    * { box-sizing: border-box; }
    .tc-tree-wrapper, .tc-forest { display: inline-flex !important; }
  `;
  const serializer = new XMLSerializer();
  const serializedHtml = serializer.serializeToString(clone);
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <title>${title}</title>
  <defs>
    <style type="text/css">
      <![CDATA[
      ${allStyles}
      ]]>
    </style>
  </defs>
  ${backgroundColor && backgroundColor !== "transparent" ? `<rect width="100%" height="100%" fill="${backgroundColor}" />` : ""}
  <g transform="translate(${padding}, ${padding})">
    <foreignObject width="${contentWidth}" height="${contentHeight}" requiredExtensions="http://www.w3.org/1999/xhtml">
      <div xmlns="http://www.w3.org/1999/xhtml" style="display:inline-block; width:100%; height:100%;">
        ${serializedHtml}
      </div>
    </foreignObject>
  </g>
</svg>`.trim();
  return svg;
}
async function exportToPng(element, options = {}) {
  const {
    scale = 2,
    quality = 1,
    backgroundColor = "transparent"
  } = options;
  const svgString = await exportToSvg(element, options);
  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const blobUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(blobUrl);
          reject(new Error("Unable to create canvas 2D rendering context."));
          return;
        }
        if (backgroundColor && backgroundColor !== "transparent") {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(blobUrl);
        const pngUrl = canvas.toDataURL("image/png", quality);
        resolve(pngUrl);
      } catch (err) {
        URL.revokeObjectURL(blobUrl);
        reject(err);
      }
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error(`Failed to load SVG into canvas for PNG rasterization: ${err}`));
    };
    img.src = blobUrl;
  });
}
async function downloadSvg(element, filename = "tree-diagram.svg", options = {}) {
  const svgString = await exportToSvg(element, options);
  downloadFile(svgString, filename, "image/svg+xml;charset=utf-8");
}
async function downloadPng(element, filename = "tree-diagram.png", options = {}) {
  const pngDataUrl = await exportToPng(element, options);
  const res = await fetch(pngDataUrl);
  const blob = await res.blob();
  downloadFile(blob, filename, "image/png");
}
function exportToJson(data, options = {}) {
  const { indent = 2 } = options;
  return JSON.stringify(data, null, indent);
}
function downloadJson(data, filename = "tree-data.json", options = {}) {
  const jsonString = exportToJson(data, options);
  downloadFile(jsonString, filename, "application/json;charset=utf-8");
}
function importFromJson(jsonString) {
  const parsed = JSON.parse(jsonString);
  const items = Array.isArray(parsed) ? parsed : [parsed];
  for (const item of items) {
    if (!item || typeof item !== "object" || typeof item.id !== "string") {
      throw new Error('[react-treecraft] Invalid tree node: missing string "id" property.');
    }
  }
  return parsed;
}
function TreeCraftInternal({
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
  orientation = "vertical",
  animationPreset = "fade",
  animationDuration,
  className = "",
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
  miniMapPosition = "bottom-right",
  onMiniMapPositionChange,
  // drag and drop
  draggableNodes = false,
  draggable = false,
  onNodeMove,
  canDrop,
  // zoom/pan
  zoomable = false
}, ref) {
  const containerRef = react.useRef(null);
  const isDraggable = draggableNodes || draggable;
  const initCollapsedIds = react.useMemo(() => {
    const arr = toArray(data);
    const all = collectAllIds(arr);
    if (collapseDepth !== void 0) {
      let walk2 = function(nodes) {
        nodes.forEach((n) => {
          flat.push({ id: n.id, _depth: n._depth });
          walk2(n.children ?? []);
        });
      };
      const annotated = annotate(arr);
      const flat = [];
      walk2(annotated);
      return new Set(flat.filter((n) => n._depth >= collapseDepth).map((n) => n.id));
    }
    if (defaultCollapsed) return new Set(all);
    return /* @__PURE__ */ new Set();
  }, []);
  const isControlledCollapse = propCollapsedIds !== void 0;
  const controlledCollapsedSet = react.useMemo(() => {
    if (propCollapsedIds === void 0) return void 0;
    return propCollapsedIds instanceof Set ? propCollapsedIds : new Set(propCollapsedIds);
  }, [propCollapsedIds]);
  const [internalCollapsedIds, setInternalCollapsedIds] = react.useState(initCollapsedIds);
  const activeCollapsedIds = controlledCollapsedSet ?? internalCollapsedIds;
  const [selectedIds, setSelectedIds] = react.useState(/* @__PURE__ */ new Set());
  const [internalFocusedId, setInternalFocusedId] = react.useState();
  const [internalHighlightPath, setInternalHighlightPath] = react.useState();
  const [draggedNodeId, setDraggedNodeId] = react.useState(null);
  const draggedNodeDescendants = react.useMemo(() => {
    if (!draggedNodeId) return /* @__PURE__ */ new Set();
    const arr = toArray(data);
    const target = findNode(arr, draggedNodeId);
    if (!target) return /* @__PURE__ */ new Set();
    return new Set(collectDescendantIds(target));
  }, [draggedNodeId, data]);
  const handleDragStartNode = react.useCallback((id) => {
    setDraggedNodeId(id);
  }, []);
  const handleDragEndNode = react.useCallback(() => {
    setDraggedNodeId(null);
  }, []);
  const activeFocusedId = focusedNodeId !== void 0 ? focusedNodeId : internalFocusedId;
  const activeHighlightPath = highlightPath !== void 0 ? highlightPath : internalHighlightPath;
  const toggleCollapse = react.useCallback((id) => {
    if (!isControlledCollapse) {
      setInternalCollapsedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  }, [isControlledCollapse]);
  const toggleSelect = react.useCallback((id, path) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const isSelected = next.has(id);
      if (selectPath) {
        if (isSelected) {
          path.forEach((ancestorId) => next.delete(ancestorId));
          setInternalHighlightPath(void 0);
          setInternalFocusedId(void 0);
        } else {
          next.clear();
          path.forEach((ancestorId) => next.add(ancestorId));
          setInternalHighlightPath(id);
          setInternalFocusedId(id);
        }
      } else {
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
  const highlightPathIds = react.useMemo(() => {
    if (!activeHighlightPath) return void 0;
    const arr = toArray(data);
    const chain = getPath(arr, activeHighlightPath);
    return chain ? new Set(chain.map((n) => n.id)) : void 0;
  }, [activeHighlightPath, data]);
  const [transform, setTransform] = react.useState({ scale: 1, x: 0, y: 0 });
  const transformRef = react.useRef({ scale: 1, x: 0, y: 0 });
  const isPanning = react.useRef(false);
  const panStart = react.useRef({ x: 0, y: 0 });
  const viewportRef = react.useRef(null);
  const canvasRef = react.useRef(null);
  react.useEffect(() => {
    transformRef.current = transform;
  }, [transform]);
  react.useEffect(() => {
    if (!zoomable) {
      transformRef.current = { scale: 1, x: 0, y: 0 };
      setTransform({ scale: 1, x: 0, y: 0 });
      if (canvasRef.current) {
        canvasRef.current.style.transform = "";
      }
    }
  }, [zoomable]);
  react.useEffect(() => {
    if (!zoomable) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    const handleWheelNative = (e) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const currentScale = transformRef.current.scale;
      const currentX = transformRef.current.x;
      const currentY = transformRef.current.y;
      const scaleMultiplier = Math.exp(-e.deltaY * 15e-4);
      const nextScale = Math.min(4, Math.max(0.15, currentScale * scaleMultiplier));
      if (nextScale === currentScale) return;
      const ratio = nextScale / currentScale;
      const canvasRect = canvas.getBoundingClientRect();
      const cursorCanvasX = e.clientX - canvasRect.left;
      const cursorCanvasY = e.clientY - canvasRect.top;
      const nextX = currentX + cursorCanvasX * (1 - ratio);
      const nextY = currentY + cursorCanvasY * (1 - ratio);
      transformRef.current = { scale: nextScale, x: nextX, y: nextY };
      canvas.style.transform = `translate(${nextX}px, ${nextY}px) scale(${nextScale})`;
      setTransform({ scale: nextScale, x: nextX, y: nextY });
    };
    viewport.addEventListener("wheel", handleWheelNative, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", handleWheelNative);
    };
  }, [zoomable]);
  const handleMouseDown = react.useCallback(
    (e) => {
      if (!zoomable || e.button !== 0) return;
      const target = e.target;
      if (target.closest("button, input, select, textarea, a")) return;
      isPanning.current = true;
      panStart.current = {
        x: e.clientX - transformRef.current.x,
        y: e.clientY - transformRef.current.y
      };
    },
    [zoomable]
  );
  const handleMouseMove = react.useCallback((e) => {
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
  const handleMouseUp = react.useCallback(() => {
    isPanning.current = false;
  }, []);
  const handleNavigate = react.useCallback((ratioX, ratioY) => {
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    if (!canvas || !viewport) return;
    const currentScale = transformRef.current.scale;
    const vRect = viewport.getBoundingClientRect();
    const cRect = canvas.getBoundingClientRect();
    const layoutLeft = cRect.left - vRect.left - transformRef.current.x;
    const layoutTop = cRect.top - vRect.top - transformRef.current.y;
    const cWidth = canvas.offsetWidth;
    const cHeight = canvas.offsetHeight;
    const nextX = vRect.width / 2 - layoutLeft - ratioX * cWidth * currentScale;
    const nextY = vRect.height / 2 - layoutTop - ratioY * cHeight * currentScale;
    transformRef.current = { scale: currentScale, x: nextX, y: nextY };
    canvas.style.transform = `translate(${nextX}px, ${nextY}px) scale(${currentScale})`;
    setTransform({ scale: currentScale, x: nextX, y: nextY });
  }, []);
  react.useImperativeHandle(
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
      exportPng: async (options) => {
        const el = canvasRef.current ?? containerRef.current;
        if (!el) throw new Error("[react-treecraft] Tree DOM element not found.");
        return exportToPng(el, options);
      },
      downloadPng: async (filename, options) => {
        const el = canvasRef.current ?? containerRef.current;
        if (!el) throw new Error("[react-treecraft] Tree DOM element not found.");
        return downloadPng(el, filename, options);
      },
      exportSvg: async (options) => {
        const el = canvasRef.current ?? containerRef.current;
        if (!el) throw new Error("[react-treecraft] Tree DOM element not found.");
        return exportToSvg(el, options);
      },
      downloadSvg: async (filename, options) => {
        const el = canvasRef.current ?? containerRef.current;
        if (!el) throw new Error("[react-treecraft] Tree DOM element not found.");
        return downloadSvg(el, filename, options);
      },
      exportJson: (options) => {
        return exportToJson(data, options);
      },
      downloadJson: (filename, options) => {
        downloadJson(data, filename, options);
      }
    }),
    [data]
  );
  const annotatedNodes = react.useMemo(() => annotate(toArray(data)), [data]);
  const rootClasses = [
    "tc-root",
    orientation === "horizontal" ? "tc-root--horizontal" : "",
    className
  ].filter(Boolean).join(" ");
  const innerStyle = zoomable ? {
    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
    transformOrigin: "0 0",
    cursor: isPanning.current ? "grabbing" : "grab"
  } : {};
  const durationStyle = animationDuration !== void 0 ? { "--tc-animation-duration": `${animationDuration}ms` } : {};
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      ref: containerRef,
      className: rootClasses,
      style: {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        ...durationStyle,
        ...style
      },
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            ref: viewportRef,
            className: "tc-viewport",
            style: {
              overflow: zoomable ? "hidden" : "auto",
              width: "100%",
              height: "100%"
            },
            onMouseDown: zoomable ? handleMouseDown : void 0,
            onMouseMove: zoomable ? handleMouseMove : void 0,
            onMouseUp: zoomable ? handleMouseUp : void 0,
            onMouseLeave: zoomable ? handleMouseUp : void 0,
            children: /* @__PURE__ */ jsxRuntime.jsx("div", { ref: canvasRef, className: "tc-canvas", style: innerStyle, children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: annotatedNodes.length > 1 ? "tc-forest" : "tc-tree-wrapper", children: annotatedNodes.map((node) => /* @__PURE__ */ jsxRuntime.jsx(
              TreeBranch,
              {
                node,
                collapsedIds: activeCollapsedIds,
                selectedIds,
                focusedNodeId: activeFocusedId,
                highlightPathIds,
                collapsible,
                selectable,
                selectPath,
                readOnly,
                orientation,
                animationPreset,
                maxDepth,
                renderNode,
                renderCollapseButton,
                onCollapseChange,
                onSelect,
                onNodeClick,
                onToggleCollapse: toggleCollapse,
                onToggleSelect: toggleSelect,
                draggableNodes: isDraggable,
                draggedNodeId,
                draggedNodeDescendants,
                onDragStartNode: handleDragStartNode,
                onDragEndNode: handleDragEndNode,
                onNodeMove,
                canDrop
              },
              node.id
            )) }) })
          }
        ),
        miniMap && /* @__PURE__ */ jsxRuntime.jsx(
          MiniMap,
          {
            data,
            containerRef: viewportRef,
            orientation,
            focusedNodeId: activeFocusedId,
            highlightPathIds,
            selectedIds,
            position: miniMapPosition,
            onPositionChange: onMiniMapPositionChange,
            scale: zoomable ? transform.scale : void 0,
            translate: zoomable ? { x: transform.x, y: transform.y } : void 0,
            onNavigate: zoomable ? handleNavigate : void 0,
            onNodeClick: (node) => {
              onNodeClick?.(node);
              const el = viewportRef.current?.querySelector(`[data-tc-node-id="${node.id}"]`);
              if (el) {
                if (zoomable) {
                  const canvas = canvasRef.current;
                  const viewport = viewportRef.current;
                  if (canvas && viewport) {
                    const nodeRect = el.getBoundingClientRect();
                    const vRect = viewport.getBoundingClientRect();
                    const deltaX = vRect.left + vRect.width / 2 - (nodeRect.left + nodeRect.width / 2);
                    const deltaY = vRect.top + vRect.height / 2 - (nodeRect.top + nodeRect.height / 2);
                    const nextX = transformRef.current.x + deltaX;
                    const nextY = transformRef.current.y + deltaY;
                    transformRef.current.x = nextX;
                    transformRef.current.y = nextY;
                    canvas.style.transform = `translate(${nextX}px, ${nextY}px) scale(${transformRef.current.scale})`;
                    setTransform((prev) => ({ ...prev, x: nextX, y: nextY }));
                  }
                } else {
                  el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
                }
              }
            }
          }
        )
      ]
    }
  );
}
var TreeCraft = react.forwardRef(TreeCraftInternal);
function TreeSearch({
  data,
  onResult,
  getLabel,
  placeholder = "Search nodes\u2026",
  className = ""
}) {
  const [query, setQuery] = react.useState("");
  const [results, setResults] = react.useState([]);
  const [open, setOpen] = react.useState(false);
  const inputRef = react.useRef(null);
  const containerRef = react.useRef(null);
  const dataArr = Array.isArray(data) ? data : [data];
  const search = react.useCallback(
    (q) => {
      if (!q.trim()) {
        setResults([]);
        setOpen(false);
        return;
      }
      const flat = flattenTree(dataArr);
      const matches = flat.filter((n) => {
        const label = getLabel ? getLabel(n) : n.id;
        return label.toLowerCase().includes(q.toLowerCase());
      }).slice(0, 20).map((n) => ({ id: n.id, label: getLabel ? getLabel(n) : n.id }));
      setResults(matches);
      setOpen(matches.length > 0);
    },
    [dataArr, getLabel]
  );
  react.useEffect(() => {
    search(query);
  }, [query, search]);
  react.useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const pick = (id) => {
    onResult(id);
    setQuery("");
    setOpen(false);
  };
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { ref: containerRef, className: `tc-search ${className}`, style: { position: "relative", display: "inline-block" }, children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      "input",
      {
        ref: inputRef,
        className: "tc-search__input",
        value: query,
        onChange: (e) => setQuery(e.target.value),
        placeholder,
        onFocus: () => results.length > 0 && setOpen(true),
        "aria-label": "Search tree nodes",
        "aria-autocomplete": "list",
        "aria-expanded": open
      }
    ),
    open && /* @__PURE__ */ jsxRuntime.jsx("ul", { className: "tc-search__results", role: "listbox", children: results.map((r) => /* @__PURE__ */ jsxRuntime.jsx(
      "li",
      {
        className: "tc-search__result-item",
        role: "option",
        onMouseDown: () => pick(r.id),
        children: r.label
      },
      r.id
    )) })
  ] });
}
function TreeExport({
  treeRef,
  data,
  filename = "tree-diagram",
  className = "",
  style,
  backgroundColor = "transparent",
  scale = 2,
  onExport
}) {
  const [open, setOpen] = react.useState(false);
  const [isExporting, setIsExporting] = react.useState(false);
  const [activeFormat, setActiveFormat] = react.useState(null);
  const dropdownRef = react.useRef(null);
  react.useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const getTargetElement = () => {
    if (!treeRef) return null;
    if ("current" in treeRef && treeRef.current) {
      const refVal = treeRef.current;
      if ("canvas" in refVal && refVal.canvas) return refVal.canvas;
      if ("container" in refVal && refVal.container) return refVal.container;
      if (refVal instanceof HTMLElement) return refVal;
    } else if ("canvas" in treeRef && treeRef.canvas) {
      return treeRef.canvas;
    } else if ("container" in treeRef && treeRef.container) {
      return treeRef.container;
    }
    return null;
  };
  const handleExport = async (format) => {
    try {
      setIsExporting(true);
      setActiveFormat(format);
      setOpen(false);
      if (format === "json") {
        if (data) {
          downloadJson(data, `${filename}.json`);
          onExport?.("json");
        } else if (treeRef && "current" in treeRef && treeRef.current && "downloadJson" in treeRef.current) {
          treeRef.current.downloadJson(`${filename}.json`);
          onExport?.("json");
        }
        return;
      }
      const targetEl = getTargetElement();
      if (!targetEl) {
        console.warn("[react-treecraft] TreeExport: Target tree element not found for image export.");
        return;
      }
      if (format === "png") {
        await downloadPng(targetEl, `${filename}.png`, {
          backgroundColor,
          scale
        });
        onExport?.("png");
      } else if (format === "svg") {
        await downloadSvg(targetEl, `${filename}.svg`, {
          backgroundColor
        });
        onExport?.("svg");
      }
    } catch (err) {
      console.error("[react-treecraft] Export failed:", err);
    } finally {
      setIsExporting(false);
      setActiveFormat(null);
    }
  };
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      ref: dropdownRef,
      className: `tc-export ${className}`,
      style,
      children: [
        /* @__PURE__ */ jsxRuntime.jsxs(
          "button",
          {
            type: "button",
            className: `tc-export-trigger ${open ? "tc-export-trigger--open" : ""}`,
            onClick: () => setOpen((o) => !o),
            disabled: isExporting,
            "aria-haspopup": "true",
            "aria-expanded": open,
            children: [
              /* @__PURE__ */ jsxRuntime.jsxs(
                "svg",
                {
                  className: "tc-export-icon",
                  width: "15",
                  height: "15",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  children: [
                    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
                    /* @__PURE__ */ jsxRuntime.jsx("polyline", { points: "7 10 12 15 17 10" }),
                    /* @__PURE__ */ jsxRuntime.jsx("line", { x1: "12", y1: "15", x2: "12", y2: "3" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntime.jsx("span", { children: isExporting ? `Exporting ${activeFormat?.toUpperCase()}...` : "Export" }),
              /* @__PURE__ */ jsxRuntime.jsx(
                "svg",
                {
                  className: `tc-export-chevron ${open ? "tc-export-chevron--open" : ""}`,
                  width: "10",
                  height: "10",
                  viewBox: "0 0 10 10",
                  fill: "none",
                  children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M2 3.5L5 6.5L8 3.5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })
                }
              )
            ]
          }
        ),
        open && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "tc-export-menu", role: "menu", children: [
          /* @__PURE__ */ jsxRuntime.jsxs(
            "button",
            {
              type: "button",
              className: "tc-export-item",
              role: "menuitem",
              onClick: () => handleExport("png"),
              children: [
                /* @__PURE__ */ jsxRuntime.jsx("span", { className: "tc-export-item-icon", children: "\u{1F4F8}" }),
                /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "tc-export-item-text", children: [
                  /* @__PURE__ */ jsxRuntime.jsx("span", { className: "tc-export-item-title", children: "Export PNG" }),
                  /* @__PURE__ */ jsxRuntime.jsx("span", { className: "tc-export-item-subtitle", children: "High resolution (2x Retina)" })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsxs(
            "button",
            {
              type: "button",
              className: "tc-export-item",
              role: "menuitem",
              onClick: () => handleExport("svg"),
              children: [
                /* @__PURE__ */ jsxRuntime.jsx("span", { className: "tc-export-item-icon", children: "\u{1F5BC}\uFE0F" }),
                /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "tc-export-item-text", children: [
                  /* @__PURE__ */ jsxRuntime.jsx("span", { className: "tc-export-item-title", children: "Export SVG" }),
                  /* @__PURE__ */ jsxRuntime.jsx("span", { className: "tc-export-item-subtitle", children: "Scalable vector diagram" })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsxs(
            "button",
            {
              type: "button",
              className: "tc-export-item",
              role: "menuitem",
              onClick: () => handleExport("json"),
              children: [
                /* @__PURE__ */ jsxRuntime.jsx("span", { className: "tc-export-item-icon", children: "\u{1F4C4}" }),
                /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "tc-export-item-text", children: [
                  /* @__PURE__ */ jsxRuntime.jsx("span", { className: "tc-export-item-title", children: "Export JSON" }),
                  /* @__PURE__ */ jsxRuntime.jsx("span", { className: "tc-export-item-subtitle", children: "Tree hierarchy data file" })
                ] })
              ]
            }
          )
        ] })
      ]
    }
  );
}
function useTreeCraft(options) {
  const [data, setData] = react.useState(options.initialData);
  const [collapsedIds, setCollapsedIds] = react.useState(/* @__PURE__ */ new Set());
  const [selectedIds, setSelectedIds] = react.useState(/* @__PURE__ */ new Set());
  const nodes = react.useCallback(() => toArray(data), [data]);
  const isForest = Array.isArray(data);
  const addChild = react.useCallback(
    (parentId, nodeData, id) => {
      const newNode = { id: id ?? generateId(), data: nodeData, children: [] };
      setData((prev) => {
        const arr = toArray(prev);
        const updated = addChildNode(arr, parentId, newNode);
        return isForest ? updated : updated[0];
      });
    },
    [isForest]
  );
  const removeNode2 = react.useCallback(
    (id) => {
      setData((prev) => {
        const arr = toArray(prev);
        const updated = removeNode(arr, id);
        return isForest ? updated : updated[0] ?? prev;
      });
      setCollapsedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [isForest]
  );
  const updateNode = react.useCallback(
    (id, partialData) => {
      setData((prev) => {
        const arr = toArray(prev);
        const updated = updateNodeData(arr, id, partialData);
        return isForest ? updated : updated[0];
      });
    },
    [isForest]
  );
  const moveNode2 = react.useCallback(
    (nodeId, targetId, position = "inside") => {
      setData((prev) => {
        const arr = toArray(prev);
        const updated = moveNode(arr, nodeId, targetId, position);
        return isForest ? updated : updated[0] ?? prev;
      });
    },
    [isForest]
  );
  const collapse = react.useCallback((id) => {
    setCollapsedIds((prev) => new Set(prev).add(id));
  }, []);
  const expand = react.useCallback((id) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);
  const toggleCollapse = react.useCallback((id) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const collapseAll = react.useCallback(() => {
    setCollapsedIds(new Set(collectAllIds(nodes())));
  }, [nodes]);
  const expandAll = react.useCallback(() => {
    setCollapsedIds(/* @__PURE__ */ new Set());
  }, []);
  const select = react.useCallback((id) => {
    setSelectedIds((prev) => new Set(prev).add(id));
  }, []);
  const deselect = react.useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);
  const toggleSelect = react.useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const clearSelection = react.useCallback(() => setSelectedIds(/* @__PURE__ */ new Set()), []);
  const find = react.useCallback(
    (id) => findNode(nodes(), id),
    [nodes]
  );
  const getPathFn = react.useCallback(
    (id) => getPath(nodes(), id) ?? [],
    [nodes]
  );
  const toFlat = react.useCallback(
    () => flattenTree(nodes()),
    [nodes]
  );
  const exportJson = react.useCallback(
    (options2) => exportToJson(data, options2),
    [data]
  );
  const downloadJson2 = react.useCallback(
    (filename, options2) => {
      downloadJson(data, filename, options2);
    },
    [data]
  );
  const importJson = react.useCallback(
    (jsonString) => {
      const imported = importFromJson(jsonString);
      setData(imported);
    },
    []
  );
  return {
    data,
    setData,
    addChild,
    removeNode: removeNode2,
    updateNode,
    moveNode: moveNode2,
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
    exportJson,
    downloadJson: downloadJson2,
    importJson
  };
}

exports.DefaultCollapseBtn = DefaultCollapseBtn;
exports.MiniMap = MiniMap;
exports.TreeConnector = TreeConnector;
exports.TreeCraft = TreeCraft;
exports.TreeExport = TreeExport;
exports.TreeSearch = TreeSearch;
exports.addChildNode = addChildNode;
exports.annotate = annotate;
exports.buildTree = buildTree;
exports.collectAllIds = collectAllIds;
exports.collectDescendantIds = collectDescendantIds;
exports.downloadFile = downloadFile;
exports.downloadJson = downloadJson;
exports.downloadPng = downloadPng;
exports.downloadSvg = downloadSvg;
exports.exportToJson = exportToJson;
exports.exportToPng = exportToPng;
exports.exportToSvg = exportToSvg;
exports.findNode = findNode;
exports.flattenTree = flattenTree;
exports.generateId = generateId;
exports.getPath = getPath;
exports.importFromJson = importFromJson;
exports.moveNode = moveNode;
exports.removeNode = removeNode;
exports.toArray = toArray;
exports.updateNodeData = updateNodeData;
exports.useTreeCraft = useTreeCraft;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map