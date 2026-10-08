import { forwardRef, useRef, useMemo, useState, useCallback, useEffect, useImperativeHandle, useLayoutEffect } from 'react';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import './index-45WPPR3E.css';

// src/components/TreeCraft.tsx
function DefaultCollapseBtn({ isCollapsed, onClick, orientation = "vertical" }) {
  const expandedClass = orientation === "horizontal" ? isCollapsed ? "" : "tc-collapse-btn--expanded-h" : isCollapsed ? "" : "tc-collapse-btn--expanded";
  return /* @__PURE__ */ jsx(
    "button",
    {
      className: `tc-collapse-btn ${expandedClass}`,
      onClick,
      "aria-label": isCollapsed ? "Expand" : "Collapse",
      title: isCollapsed ? "Expand" : "Collapse",
      children: /* @__PURE__ */ jsx(
        "svg",
        {
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 2.5,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          children: /* @__PURE__ */ jsx("polyline", { points: "6 9 12 15 18 9" })
        }
      )
    }
  );
}
function TreeConnector({
  orientation,
  childrenRowRef,
  childrenNodes,
  highlightPathIds,
  connectorType = "orthogonal",
  connectorPattern = "solid",
  lineRadius = 8,
  lineColor,
  lineWidth,
  highlightColor
}) {
  const containerRef = useRef(null);
  const [layout, setLayout] = useState({ parentCoord: 0, childCoords: [], width: 0, height: 0 });
  const measure = useCallback(() => {
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
  useLayoutEffect(() => {
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
    return /* @__PURE__ */ jsx(
      "div",
      {
        ref: containerRef,
        className: `tc-connector-zone tc-connector-zone--${orientation}`,
        "aria-hidden": "true"
      }
    );
  }
  const activeIndices = childrenNodes.map((child, idx) => highlightPathIds?.has(child.id) ? idx : -1).filter((idx) => idx !== -1);
  let basePath = "";
  let highlightedPaths = [];
  if (orientation === "vertical") {
    const midY = height / 2;
    if (connectorType === "curved") {
      basePath = childCoords.map((x) => `M ${parentCoord} 0 C ${parentCoord} ${midY}, ${x} ${midY}, ${x} ${height}`).join(" ");
      highlightedPaths = activeIndices.map((idx) => {
        const x = childCoords[idx];
        return x !== void 0 ? `M ${parentCoord} 0 C ${parentCoord} ${midY}, ${x} ${midY}, ${x} ${height}` : "";
      }).filter(Boolean);
    } else if (connectorType === "straight") {
      basePath = childCoords.map((x) => `M ${parentCoord} 0 L ${x} ${height}`).join(" ");
      highlightedPaths = activeIndices.map((idx) => {
        const x = childCoords[idx];
        return x !== void 0 ? `M ${parentCoord} 0 L ${x} ${height}` : "";
      }).filter(Boolean);
    } else {
      if (childCoords.length === 1) {
        basePath = `M ${parentCoord} 0 L ${childCoords[0]} ${height}`;
        highlightedPaths = activeIndices.map(() => `M ${parentCoord} 0 L ${childCoords[0]} ${height}`);
      } else if (lineRadius <= 0) {
        const minX = childCoords[0];
        const maxX = childCoords[childCoords.length - 1];
        const stemsDown = childCoords.map((x) => `M ${x} ${midY} L ${x} ${height}`).join(" ");
        basePath = `M ${parentCoord} 0 L ${parentCoord} ${midY} M ${minX} ${midY} L ${maxX} ${midY} ${stemsDown}`;
        highlightedPaths = activeIndices.map((idx) => {
          const x = childCoords[idx];
          return x !== void 0 ? `M ${parentCoord} 0 L ${parentCoord} ${midY} L ${x} ${midY} L ${x} ${height}` : "";
        }).filter(Boolean);
      } else {
        const branchPaths = childCoords.map((x) => {
          if (Math.abs(x - parentCoord) < 2) {
            return `M ${parentCoord} 0 L ${parentCoord} ${height}`;
          }
          const isLeft = x < parentCoord;
          const r1 = Math.min(lineRadius, Math.abs(parentCoord - x) / 2, midY / 2);
          const r2 = Math.min(lineRadius, Math.abs(parentCoord - x) / 2, (height - midY) / 2);
          if (isLeft) {
            return `M ${parentCoord} 0 L ${parentCoord} ${midY - r1} Q ${parentCoord} ${midY} ${parentCoord - r1} ${midY} L ${x + r2} ${midY} Q ${x} ${midY} ${x} ${midY + r2} L ${x} ${height}`;
          }
          return `M ${parentCoord} 0 L ${parentCoord} ${midY - r1} Q ${parentCoord} ${midY} ${parentCoord + r1} ${midY} L ${x - r2} ${midY} Q ${x} ${midY} ${x} ${midY + r2} L ${x} ${height}`;
        });
        basePath = branchPaths.join(" ");
        highlightedPaths = activeIndices.map((idx) => branchPaths[idx] || "").filter(Boolean);
      }
    }
  }
  if (orientation === "horizontal") {
    const midX = width / 2;
    if (connectorType === "curved") {
      basePath = childCoords.map((y) => `M 0 ${parentCoord} C ${midX} ${parentCoord}, ${midX} ${y}, ${width} ${y}`).join(" ");
      highlightedPaths = activeIndices.map((idx) => {
        const y = childCoords[idx];
        return y !== void 0 ? `M 0 ${parentCoord} C ${midX} ${parentCoord}, ${midX} ${y}, ${width} ${y}` : "";
      }).filter(Boolean);
    } else if (connectorType === "straight") {
      basePath = childCoords.map((y) => `M 0 ${parentCoord} L ${width} ${y}`).join(" ");
      highlightedPaths = activeIndices.map((idx) => {
        const y = childCoords[idx];
        return y !== void 0 ? `M 0 ${parentCoord} L ${width} ${y}` : "";
      }).filter(Boolean);
    } else {
      if (childCoords.length === 1) {
        basePath = `M 0 ${parentCoord} L ${width} ${childCoords[0]}`;
        highlightedPaths = activeIndices.map(() => `M 0 ${parentCoord} L ${width} ${childCoords[0]}`);
      } else if (lineRadius <= 0) {
        const minY = childCoords[0];
        const maxY = childCoords[childCoords.length - 1];
        const stemsRight = childCoords.map((y) => `M ${midX} ${y} L ${width} ${y}`).join(" ");
        basePath = `M 0 ${parentCoord} L ${midX} ${parentCoord} M ${midX} ${minY} L ${midX} ${maxY} ${stemsRight}`;
        highlightedPaths = activeIndices.map((idx) => {
          const y = childCoords[idx];
          return y !== void 0 ? `M 0 ${parentCoord} L ${midX} ${parentCoord} L ${midX} ${y} L ${width} ${y}` : "";
        }).filter(Boolean);
      } else {
        const branchPaths = childCoords.map((y) => {
          if (Math.abs(y - parentCoord) < 2) {
            return `M 0 ${parentCoord} L ${width} ${parentCoord}`;
          }
          const isUp = y < parentCoord;
          const r1 = Math.min(lineRadius, midX / 2, Math.abs(parentCoord - y) / 2);
          const r2 = Math.min(lineRadius, (width - midX) / 2, Math.abs(parentCoord - y) / 2);
          if (isUp) {
            return `M 0 ${parentCoord} L ${midX - r1} ${parentCoord} Q ${midX} ${parentCoord} ${midX} ${parentCoord - r1} L ${midX} ${y + r2} Q ${midX} ${y} ${midX + r2} ${y} L ${width} ${y}`;
          }
          return `M 0 ${parentCoord} L ${midX - r1} ${parentCoord} Q ${midX} ${parentCoord} ${midX} ${parentCoord + r1} L ${midX} ${y - r2} Q ${midX} ${y} ${midX + r2} ${y} L ${width} ${y}`;
        });
        basePath = branchPaths.join(" ");
        highlightedPaths = activeIndices.map((idx) => branchPaths[idx] || "").filter(Boolean);
      }
    }
  }
  const baseStyle = {
    ...lineColor ? { stroke: lineColor } : {},
    ...lineWidth !== void 0 ? { strokeWidth: lineWidth } : {}
  };
  const highlightStyle = {
    ...highlightColor ? { stroke: highlightColor } : {},
    ...lineWidth !== void 0 ? { strokeWidth: lineWidth + 0.5 } : {}
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: containerRef,
      className: `tc-connector-zone tc-connector-zone--${orientation}`,
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsxs(
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
            /* @__PURE__ */ jsx(
              "path",
              {
                d: basePath,
                className: `tc-line tc-line--base tc-line--${connectorPattern}`,
                style: baseStyle,
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round"
              }
            ),
            highlightedPaths.map((d, i) => /* @__PURE__ */ jsx(
              "path",
              {
                d,
                className: `tc-line tc-line--highlighted tc-line--${connectorPattern}`,
                style: highlightStyle,
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
  connectorType = "orthogonal",
  connectorPattern = "solid",
  lineRadius = 8,
  lineColor,
  lineWidth,
  highlightColor,
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
  const childrenRowRef = useRef(null);
  const children = node.children ?? [];
  const [dropPosition, setDropPosition] = useState(null);
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
  const collapseBtn = showCollapseBtn ? renderCollapseButton ? renderCollapseButton({ isCollapsed, onToggle: handleCollapseClick, node }) : /* @__PURE__ */ jsx(
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
  const nodeCardEl = /* @__PURE__ */ jsxs(
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
        dropPosition === "before" && /* @__PURE__ */ jsx("div", { className: "tc-drop-indicator tc-drop-indicator--before" }),
        dropPosition === "after" && /* @__PURE__ */ jsx("div", { className: "tc-drop-indicator tc-drop-indicator--after" }),
        /* @__PURE__ */ jsx(
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
    return /* @__PURE__ */ jsxs("div", { className: `tc-branch tc-branch--horizontal ${animClass}`, style: animStyle, children: [
      nodeCardEl,
      showChildren && /* @__PURE__ */ jsxs("div", { className: "tc-subtree tc-subtree--horizontal", children: [
        /* @__PURE__ */ jsx(
          TreeConnector,
          {
            orientation,
            childrenRowRef,
            childrenNodes: children,
            highlightPathIds,
            connectorType,
            connectorPattern,
            lineRadius,
            lineColor,
            lineWidth,
            highlightColor
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "tc-children-row tc-children-row--horizontal", ref: childrenRowRef, children: children.map((child, idx) => /* @__PURE__ */ jsx(
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
            connectorType,
            connectorPattern,
            lineRadius,
            lineColor,
            lineWidth,
            highlightColor,
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
  return /* @__PURE__ */ jsxs("div", { className: `tc-branch tc-branch--vertical ${animClass}`, style: animStyle, children: [
    nodeCardEl,
    showChildren && /* @__PURE__ */ jsxs("div", { className: "tc-subtree tc-subtree--vertical", children: [
      /* @__PURE__ */ jsx(
        TreeConnector,
        {
          orientation,
          childrenRowRef,
          childrenNodes: children,
          highlightPathIds,
          connectorType,
          connectorPattern,
          lineRadius,
          lineColor,
          lineWidth,
          highlightColor
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "tc-children-row tc-children-row--vertical", ref: childrenRowRef, children: children.map((child, idx) => /* @__PURE__ */ jsx(
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
          connectorType,
          connectorPattern,
          lineRadius,
          lineColor,
          lineWidth,
          highlightColor,
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
  const canvasRef = useRef(null);
  const [minimized, setMinimized] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [viewportBox, setViewportBox] = useState(null);
  const isDraggingRadar = useRef(false);
  const dataArr = useMemo(() => toArray(data), [data]);
  useEffect(() => {
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
  const { layoutNodes, totalNodes } = useMemo(() => {
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
  useEffect(() => {
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
  const panToCanvasCoords = useCallback((mouseX, mouseY, smooth = true) => {
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
  const handleMouseMove = useCallback(
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
  const handleMouseDown = useCallback((e) => {
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
  const handleMouseUp = useCallback(() => {
    isDraggingRadar.current = false;
  }, []);
  const handleCyclePosition = () => {
    const currentIndex = POSITIONS.indexOf(position);
    const nextPosition = POSITIONS[(currentIndex + 1) % POSITIONS.length];
    onPositionChange?.(nextPosition);
  };
  const posClass = `tc-minimap--${position}`;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `tc-minimap ${posClass} ${minimized ? "tc-minimap--minimized" : ""}`,
      title: "Tree Radar Overview",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "tc-minimap__header", children: [
          /* @__PURE__ */ jsxs("div", { className: "tc-minimap__badge", children: [
            /* @__PURE__ */ jsx("span", { className: "tc-minimap__indicator" }),
            /* @__PURE__ */ jsx("span", { className: "tc-minimap__title", children: "Radar" }),
            /* @__PURE__ */ jsx("span", { className: "tc-minimap__count", children: totalNodes })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "tc-minimap__actions", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "tc-minimap__btn",
                onClick: handleCyclePosition,
                title: `Current position: ${position}. Click to move corner.`,
                children: /* @__PURE__ */ jsxs("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: [
                  /* @__PURE__ */ jsx("rect", { x: "1.5", y: "1.5", width: "3.5", height: "3.5", rx: "1", fill: position === "top-left" ? "#60a5fa" : "currentColor", opacity: position === "top-left" ? 1 : 0.4 }),
                  /* @__PURE__ */ jsx("rect", { x: "7", y: "1.5", width: "3.5", height: "3.5", rx: "1", fill: position === "top-right" ? "#60a5fa" : "currentColor", opacity: position === "top-right" ? 1 : 0.4 }),
                  /* @__PURE__ */ jsx("rect", { x: "1.5", y: "7", width: "3.5", height: "3.5", rx: "1", fill: position === "bottom-left" ? "#60a5fa" : "currentColor", opacity: position === "bottom-left" ? 1 : 0.4 }),
                  /* @__PURE__ */ jsx("rect", { x: "7", y: "7", width: "3.5", height: "3.5", rx: "1", fill: position === "bottom-right" ? "#60a5fa" : "currentColor", opacity: position === "bottom-right" ? 1 : 0.4 })
                ] })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "tc-minimap__btn",
                onClick: () => setMinimized((m) => !m),
                title: minimized ? "Expand Radar" : "Minimize Radar",
                children: minimized ? /* @__PURE__ */ jsx("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M2 5L6 9L10 5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }) : /* @__PURE__ */ jsx("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M2 7L6 3L10 7", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) })
              }
            )
          ] })
        ] }),
        !minimized && /* @__PURE__ */ jsxs("div", { className: "tc-minimap__canvas-container", children: [
          /* @__PURE__ */ jsx(
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
          hoveredNode && /* @__PURE__ */ jsx(
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
  let url;
  let isCreatedUrl = false;
  if (typeof content === "string") {
    if (content.startsWith("data:")) {
      url = content;
    } else {
      const blob = new Blob([content], { type: mimeType });
      url = URL.createObjectURL(blob);
      isCreatedUrl = true;
    }
  } else {
    url = URL.createObjectURL(content);
    isCreatedUrl = true;
  }
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    document.body.removeChild(anchor);
    if (isCreatedUrl) {
      URL.revokeObjectURL(url);
    }
  }, 300);
}
function collectDocumentStyles(safeForCanvas = false) {
  if (typeof document === "undefined") return "";
  const cssChunks = [];
  try {
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
  } catch {
  }
  const styleSheets = Array.from(document.styleSheets);
  for (const sheet of styleSheets) {
    try {
      if (sheet.cssRules) {
        const rules = Array.from(sheet.cssRules);
        for (const rule of rules) {
          let text = rule.cssText;
          if (safeForCanvas) {
            if (rule.type === CSSRule.IMPORT_RULE) continue;
            text = text.replace(/url\(['"]?https?:\/\/[^)'"]+['"]?\)/gi, "none");
          }
          cssChunks.push(text);
        }
      }
    } catch {
    }
  }
  return cssChunks.join("\n");
}
function getTreeDimensions(element, padding = 32) {
  const treeWrapper = element.querySelector(".tc-tree-wrapper, .tc-forest");
  const canvasEl = element.querySelector(".tc-canvas");
  const target = treeWrapper ?? canvasEl ?? element;
  const allNodes = Array.from(target.querySelectorAll(".tc-node-card, .tc-branch"));
  let maxW = target.scrollWidth || 0;
  let maxH = target.scrollHeight || 0;
  if (allNodes.length > 0) {
    const rootRect = target.getBoundingClientRect();
    let scaleFactor = 1;
    if (canvasEl && canvasEl.style.transform) {
      const match = canvasEl.style.transform.match(/scale\(([^)]+)\)/);
      if (match) scaleFactor = parseFloat(match[1]) || 1;
    }
    allNodes.forEach((node) => {
      const nr = node.getBoundingClientRect();
      const right = (nr.right - rootRect.left) / scaleFactor;
      const bottom = (nr.bottom - rootRect.top) / scaleFactor;
      if (right > maxW) maxW = right;
      if (bottom > maxH) maxH = bottom;
    });
  }
  const contentWidth = Math.ceil(Math.max(maxW, target.offsetWidth || 0, 400));
  const contentHeight = Math.ceil(Math.max(maxH, target.offsetHeight || 0, 300));
  const totalWidth = Math.ceil(contentWidth + padding * 2);
  const totalHeight = Math.ceil(contentHeight + padding * 2);
  return { contentWidth, contentHeight, totalWidth, totalHeight, target };
}
async function exportToSvg(element, options = {}) {
  if (typeof window === "undefined") {
    throw new Error("[react-treecraft] SVG export requires a browser environment.");
  }
  const {
    backgroundColor = "transparent",
    padding = 32,
    title = "Tree Diagram",
    customCss = "",
    safeForCanvas = false
  } = options;
  const { contentWidth, contentHeight, totalWidth, totalHeight, target } = getTreeDimensions(element, padding);
  const clone = target.cloneNode(true);
  clone.style.transform = "none";
  clone.style.margin = "0";
  clone.style.position = "static";
  clone.style.left = "auto";
  clone.style.top = "auto";
  clone.style.width = `${contentWidth}px`;
  clone.style.height = `${contentHeight}px`;
  clone.querySelectorAll("*").forEach((el) => {
    el.style.removeProperty("animation");
    el.style.removeProperty("animation-delay");
    el.style.removeProperty("animation-fill-mode");
    el.style.removeProperty("animation-name");
    el.style.removeProperty("animation-duration");
    el.style.opacity = "1";
    el.style.transform = "none";
    el.style.filter = "none";
    el.style.visibility = "visible";
    el.classList.remove("tc-node-card--dragging");
    el.classList.remove("tc-node-card--drop-inside");
  });
  const docStyles = collectDocumentStyles(safeForCanvas);
  const allStyles = `
    ${docStyles}
    ${customCss}
    *, *::before, *::after {
      box-sizing: border-box;
      animation: none !important;
      transition: none !important;
    }
    [class*="tc-anim-"] {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
      visibility: visible !important;
    }
    .tc-tree-wrapper, .tc-forest {
      display: inline-flex !important;
      min-width: max-content !important;
      min-height: max-content !important;
      width: 100% !important;
      height: 100% !important;
      transform: none !important;
      position: static !important;
      overflow: visible !important;
    }
    .tc-branch {
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
      visibility: visible !important;
    }
    .tc-canvas {
      display: inline-flex !important;
      width: auto !important;
      height: auto !important;
      transform: none !important;
      overflow: visible !important;
    }
    .tc-children-row--vertical, .tc-children-row--horizontal {
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
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
      <div xmlns="http://www.w3.org/1999/xhtml" style="display:inline-flex; width:${contentWidth}px; height:${contentHeight}px; min-width:max-content; min-height:max-content;">
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
    backgroundColor = "transparent",
    padding = 32
  } = options;
  const { totalWidth, totalHeight } = getTreeDimensions(element, padding);
  const svgString = await exportToSvg(element, {
    ...options,
    safeForCanvas: true
  });
  return new Promise((resolve, reject) => {
    let dataUri;
    try {
      const utf8Bytes = new TextEncoder().encode(svgString);
      let binary = "";
      for (let i = 0; i < utf8Bytes.length; i++) {
        binary += String.fromCharCode(utf8Bytes[i]);
      }
      dataUri = `data:image/svg+xml;base64,${btoa(binary)}`;
    } catch {
      dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(totalWidth * scale);
        canvas.height = Math.round(totalHeight * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Unable to create canvas 2D rendering context."));
          return;
        }
        if (backgroundColor && backgroundColor !== "transparent") {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL("image/png", quality);
        resolve(pngUrl);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => {
      reject(new Error(`Failed to load SVG into canvas for PNG rasterization: ${err}`));
    };
    img.src = dataUri;
  });
}
async function downloadSvg(element, filename = "tree-diagram.svg", options = {}) {
  const svgString = await exportToSvg(element, options);
  downloadFile(svgString, filename, "image/svg+xml;charset=utf-8");
}
async function downloadPng(element, filename = "tree-diagram.png", options = {}) {
  const pngDataUrl = await exportToPng(element, options);
  downloadFile(pngDataUrl, filename, "image/png");
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
function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const result = importFromJson(text);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
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
  // styling & connectors
  orientation = "vertical",
  animationPreset = "fade",
  animationDuration,
  showLines = true,
  connectorType,
  connectorPattern,
  lineColor,
  lineWidth,
  lineRadius,
  highlightColor,
  theme,
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
  const containerRef = useRef(null);
  const isDraggable = draggableNodes || draggable;
  const resolvedConnectorType = connectorType ?? theme?.lineType ?? "orthogonal";
  const resolvedConnectorPattern = connectorPattern ?? theme?.linePattern ?? "solid";
  const resolvedLineColor = lineColor ?? theme?.lineColor;
  const resolvedLineWidth = lineWidth ?? theme?.lineWidth;
  const resolvedLineRadius = lineRadius ?? theme?.lineRadius ?? 8;
  const resolvedHighlightColor = highlightColor ?? theme?.highlightColor;
  const initCollapsedIds = useMemo(() => {
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
  const controlledCollapsedSet = useMemo(() => {
    if (propCollapsedIds === void 0) return void 0;
    return propCollapsedIds instanceof Set ? propCollapsedIds : new Set(propCollapsedIds);
  }, [propCollapsedIds]);
  const [internalCollapsedIds, setInternalCollapsedIds] = useState(initCollapsedIds);
  const activeCollapsedIds = controlledCollapsedSet ?? internalCollapsedIds;
  const [selectedIds, setSelectedIds] = useState(/* @__PURE__ */ new Set());
  const [internalFocusedId, setInternalFocusedId] = useState();
  const [internalHighlightPath, setInternalHighlightPath] = useState();
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const draggedNodeDescendants = useMemo(() => {
    if (!draggedNodeId) return /* @__PURE__ */ new Set();
    const arr = toArray(data);
    const target = findNode(arr, draggedNodeId);
    if (!target) return /* @__PURE__ */ new Set();
    return new Set(collectDescendantIds(target));
  }, [draggedNodeId, data]);
  const handleDragStartNode = useCallback((id) => {
    setDraggedNodeId(id);
  }, []);
  const handleDragEndNode = useCallback(() => {
    setDraggedNodeId(null);
  }, []);
  const activeFocusedId = focusedNodeId !== void 0 ? focusedNodeId : internalFocusedId;
  const activeHighlightPath = highlightPath !== void 0 ? highlightPath : internalHighlightPath;
  const toggleCollapse = useCallback((id) => {
    if (!isControlledCollapse) {
      setInternalCollapsedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  }, [isControlledCollapse]);
  const toggleSelect = useCallback((id, path) => {
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
  const highlightPathIds = useMemo(() => {
    if (!activeHighlightPath) return void 0;
    const arr = toArray(data);
    const chain = getPath(arr, activeHighlightPath);
    return chain ? new Set(chain.map((n) => n.id)) : void 0;
  }, [activeHighlightPath, data]);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const transformRef = useRef({ scale: 1, x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const viewportRef = useRef(null);
  const canvasRef = useRef(null);
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);
  useEffect(() => {
    if (!zoomable) {
      transformRef.current = { scale: 1, x: 0, y: 0 };
      setTransform({ scale: 1, x: 0, y: 0 });
      if (canvasRef.current) {
        canvasRef.current.style.transform = "";
      }
    }
  }, [zoomable]);
  useEffect(() => {
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
  const handleMouseDown = useCallback(
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
  const handleMouseMove = useCallback((e) => {
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
  const handleNavigate = useCallback((ratioX, ratioY) => {
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
  const annotatedNodes = useMemo(() => annotate(toArray(data)), [data]);
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
  const lineThemeStyle = {
    ...resolvedLineColor ? { "--tc-line-color": resolvedLineColor } : {},
    ...resolvedLineWidth !== void 0 ? { "--tc-line-width": `${resolvedLineWidth}px` } : {},
    ...resolvedLineRadius !== void 0 ? { "--tc-line-radius": `${resolvedLineRadius}px` } : {},
    ...resolvedHighlightColor ? { "--tc-focus-color": resolvedHighlightColor } : {},
    ...theme?.nodeGap !== void 0 ? { "--tc-node-gap": `${theme.nodeGap}px` } : {},
    ...theme?.levelGap !== void 0 ? { "--tc-level-gap": `${theme.levelGap}px` } : {},
    ...theme?.animationDuration !== void 0 ? { "--tc-animation-duration": `${theme.animationDuration}ms` } : {},
    ...animationDuration !== void 0 ? { "--tc-animation-duration": `${animationDuration}ms` } : {}
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: containerRef,
      className: rootClasses,
      style: {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        ...lineThemeStyle,
        ...style
      },
      children: [
        /* @__PURE__ */ jsx(
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
            children: /* @__PURE__ */ jsx("div", { ref: canvasRef, className: "tc-canvas", style: innerStyle, children: /* @__PURE__ */ jsx("div", { className: annotatedNodes.length > 1 ? "tc-forest" : "tc-tree-wrapper", children: annotatedNodes.map((node) => /* @__PURE__ */ jsx(
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
                connectorType: resolvedConnectorType,
                connectorPattern: resolvedConnectorPattern,
                lineRadius: resolvedLineRadius,
                lineColor: resolvedLineColor,
                lineWidth: resolvedLineWidth,
                highlightColor: resolvedHighlightColor,
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
        miniMap && /* @__PURE__ */ jsx(
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
var TreeCraft = forwardRef(TreeCraftInternal);
function TreeSearch({
  data,
  onResult,
  getLabel,
  placeholder = "Search nodes\u2026",
  className = ""
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const dataArr = Array.isArray(data) ? data : [data];
  const search = useCallback(
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
  useEffect(() => {
    search(query);
  }, [query, search]);
  useEffect(() => {
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
  return /* @__PURE__ */ jsxs("div", { ref: containerRef, className: `tc-search ${className}`, style: { position: "relative", display: "inline-block" }, children: [
    /* @__PURE__ */ jsx(
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
    open && /* @__PURE__ */ jsx("ul", { className: "tc-search__results", role: "listbox", children: results.map((r) => /* @__PURE__ */ jsx(
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
  allowImport = true,
  onImport,
  onExport
}) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeFormat, setActiveFormat] = useState(null);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  useEffect(() => {
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
  const handleImportClick = () => {
    setOpen(false);
    fileInputRef.current?.click();
  };
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const importedData = await readJsonFile(file);
      onImport?.(importedData);
    } catch (err) {
      console.error("[react-treecraft] Import JSON failed:", err);
      alert("Failed to parse JSON file. Please ensure it is a valid TreeCraft JSON export.");
    } finally {
      e.target.value = "";
    }
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: dropdownRef,
      className: `tc-export ${className}`,
      style,
      children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: `tc-export-trigger ${open ? "tc-export-trigger--open" : ""}`,
            onClick: () => setOpen((o) => !o),
            disabled: isExporting,
            "aria-haspopup": "true",
            "aria-expanded": open,
            children: [
              /* @__PURE__ */ jsxs(
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
                    /* @__PURE__ */ jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
                    /* @__PURE__ */ jsx("polyline", { points: "7 10 12 15 17 10" }),
                    /* @__PURE__ */ jsx("line", { x1: "12", y1: "15", x2: "12", y2: "3" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx("span", { children: isExporting ? `Exporting ${activeFormat?.toUpperCase()}...` : "Export / Import" }),
              /* @__PURE__ */ jsx(
                "svg",
                {
                  className: `tc-export-chevron ${open ? "tc-export-chevron--open" : ""}`,
                  width: "10",
                  height: "10",
                  viewBox: "0 0 10 10",
                  fill: "none",
                  children: /* @__PURE__ */ jsx("path", { d: "M2 3.5L5 6.5L8 3.5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })
                }
              )
            ]
          }
        ),
        open && /* @__PURE__ */ jsxs("div", { className: "tc-export-menu", role: "menu", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "tc-export-item",
              role: "menuitem",
              onClick: () => handleExport("png"),
              children: [
                /* @__PURE__ */ jsx("span", { className: "tc-export-item-icon", children: "\u{1F4F8}" }),
                /* @__PURE__ */ jsxs("div", { className: "tc-export-item-text", children: [
                  /* @__PURE__ */ jsx("span", { className: "tc-export-item-title", children: "Export PNG" }),
                  /* @__PURE__ */ jsx("span", { className: "tc-export-item-subtitle", children: "High resolution raster image" })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "tc-export-item",
              role: "menuitem",
              onClick: () => handleExport("svg"),
              children: [
                /* @__PURE__ */ jsx("span", { className: "tc-export-item-icon", children: "\u{1F5BC}\uFE0F" }),
                /* @__PURE__ */ jsxs("div", { className: "tc-export-item-text", children: [
                  /* @__PURE__ */ jsx("span", { className: "tc-export-item-title", children: "Export SVG" }),
                  /* @__PURE__ */ jsx("span", { className: "tc-export-item-subtitle", children: "Scalable vector diagram" })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "tc-export-item",
              role: "menuitem",
              onClick: () => handleExport("json"),
              children: [
                /* @__PURE__ */ jsx("span", { className: "tc-export-item-icon", children: "\u{1F4C4}" }),
                /* @__PURE__ */ jsxs("div", { className: "tc-export-item-text", children: [
                  /* @__PURE__ */ jsx("span", { className: "tc-export-item-title", children: "Export JSON" }),
                  /* @__PURE__ */ jsx("span", { className: "tc-export-item-subtitle", children: "Tree hierarchy data file" })
                ] })
              ]
            }
          ),
          allowImport && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "tc-export-divider", style: { height: 1, background: "rgba(255,255,255,0.08)", margin: "4px 0" } }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                className: "tc-export-item",
                role: "menuitem",
                onClick: handleImportClick,
                children: [
                  /* @__PURE__ */ jsx("span", { className: "tc-export-item-icon", children: "\u{1F4E5}" }),
                  /* @__PURE__ */ jsxs("div", { className: "tc-export-item-text", children: [
                    /* @__PURE__ */ jsx("span", { className: "tc-export-item-title", children: "Import JSON" }),
                    /* @__PURE__ */ jsx("span", { className: "tc-export-item-subtitle", children: "Load from JSON file" })
                  ] })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: fileInputRef,
            type: "file",
            accept: ".json,application/json",
            style: { display: "none" },
            onChange: handleFileChange
          }
        )
      ]
    }
  );
}
function useTreeCraft(options) {
  const [data, setData] = useState(options.initialData);
  const [collapsedIds, setCollapsedIds] = useState(/* @__PURE__ */ new Set());
  const [selectedIds, setSelectedIds] = useState(/* @__PURE__ */ new Set());
  const nodes = useCallback(() => toArray(data), [data]);
  const isForest = Array.isArray(data);
  const addChild = useCallback(
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
  const removeNode2 = useCallback(
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
  const updateNode = useCallback(
    (id, partialData) => {
      setData((prev) => {
        const arr = toArray(prev);
        const updated = updateNodeData(arr, id, partialData);
        return isForest ? updated : updated[0];
      });
    },
    [isForest]
  );
  const moveNode2 = useCallback(
    (nodeId, targetId, position = "inside") => {
      setData((prev) => {
        const arr = toArray(prev);
        const updated = moveNode(arr, nodeId, targetId, position);
        return isForest ? updated : updated[0] ?? prev;
      });
    },
    [isForest]
  );
  const collapse = useCallback((id) => {
    setCollapsedIds((prev) => new Set(prev).add(id));
  }, []);
  const expand = useCallback((id) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);
  const toggleCollapse = useCallback((id) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const collapseAll = useCallback(() => {
    setCollapsedIds(new Set(collectAllIds(nodes())));
  }, [nodes]);
  const expandAll = useCallback(() => {
    setCollapsedIds(/* @__PURE__ */ new Set());
  }, []);
  const select = useCallback((id) => {
    setSelectedIds((prev) => new Set(prev).add(id));
  }, []);
  const deselect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);
  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const clearSelection = useCallback(() => setSelectedIds(/* @__PURE__ */ new Set()), []);
  const find = useCallback(
    (id) => findNode(nodes(), id),
    [nodes]
  );
  const getPathFn = useCallback(
    (id) => getPath(nodes(), id) ?? [],
    [nodes]
  );
  const toFlat = useCallback(
    () => flattenTree(nodes()),
    [nodes]
  );
  const exportJson = useCallback(
    (options2) => exportToJson(data, options2),
    [data]
  );
  const downloadJson2 = useCallback(
    (filename, options2) => {
      downloadJson(data, filename, options2);
    },
    [data]
  );
  const importJson = useCallback(
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

export { DefaultCollapseBtn, MiniMap, TreeConnector, TreeCraft, TreeExport, TreeSearch, addChildNode, annotate, buildTree, collectAllIds, collectDescendantIds, downloadFile, downloadJson, downloadPng, downloadSvg, exportToJson, exportToPng, exportToSvg, findNode, flattenTree, generateId, getPath, importFromJson, moveNode, readJsonFile, removeNode, toArray, updateNodeData, useTreeCraft };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map