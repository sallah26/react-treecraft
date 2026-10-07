import { useRef, useState, useCallback, useLayoutEffect, useMemo, useEffect } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';
import './index-5QPDOHJ2.css';

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
  highlightPathIds
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
    return /* @__PURE__ */ jsx(
      "div",
      {
        ref: containerRef,
        className: "tc-connector-zone tc-connector-zone--vertical",
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
                  d: basePath2,
                  className: "tc-line tc-line--base",
                  fill: "none",
                  strokeLinecap: "round",
                  strokeLinejoin: "round"
                }
              ),
              highlightedPaths2.map((d, i) => /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: containerRef,
      className: "tc-connector-zone tc-connector-zone--horizontal",
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
                className: "tc-line tc-line--base",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round"
              }
            ),
            highlightedPaths.map((d, i) => /* @__PURE__ */ jsx(
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
  onToggleSelect
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
    hasFocusPath ? "tc-has-focus-path" : ""
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
  if (orientation === "horizontal") {
    return /* @__PURE__ */ jsxs("div", { className: `tc-branch tc-branch--horizontal ${animClass}`, style: animStyle, children: [
      /* @__PURE__ */ jsxs("div", { className: nodeWrapperClasses, children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: `tc-node-inner ${isClickSelectable ? "tc-node-inner--selectable" : ""}`,
            onClick: handleNodeClick,
            children: renderedNodeContent
          }
        ),
        collapseBtn
      ] }),
      showChildren && /* @__PURE__ */ jsxs("div", { className: "tc-subtree tc-subtree--horizontal", children: [
        /* @__PURE__ */ jsx(
          TreeConnector,
          {
            orientation,
            childrenRowRef,
            childrenNodes: children,
            highlightPathIds
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
            onToggleSelect
          },
          child.id
        )) })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: `tc-branch tc-branch--vertical ${animClass}`, style: animStyle, children: [
    /* @__PURE__ */ jsxs("div", { className: nodeWrapperClasses, children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: `tc-node-inner ${isClickSelectable ? "tc-node-inner--selectable" : ""}`,
          onClick: handleNodeClick,
          children: renderedNodeContent
        }
      ),
      collapseBtn
    ] }),
    showChildren && /* @__PURE__ */ jsxs("div", { className: "tc-subtree tc-subtree--vertical", children: [
      /* @__PURE__ */ jsx(
        TreeConnector,
        {
          orientation,
          childrenRowRef,
          childrenNodes: children,
          highlightPathIds
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
          onToggleSelect
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
function moveNode(nodes, nodeId, newParentId) {
  const target = findNode(nodes, nodeId);
  if (!target) return nodes;
  const descendantIds = new Set(collectDescendantIds(target));
  if (descendantIds.has(newParentId)) {
    console.warn("[react-treecraft] Cannot move a node into its own descendant.");
    return nodes;
  }
  const stripped = removeNode(nodes, nodeId);
  return addChildNode(stripped, newParentId, target);
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
  onNodeClick
}) {
  const canvasRef = useRef(null);
  const [minimized, setMinimized] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const dataArr = useMemo(() => toArray(data), [data]);
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
  }, [layoutNodes, focusedNodeId, highlightPathIds, selectedIds, orientation, minimized]);
  const handleMouseMove = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
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
    [layoutNodes]
  );
  const handleClick = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      for (const node of layoutNodes) {
        const dx = node.canvasX - mouseX;
        const dy = node.canvasY - mouseY;
        if (Math.hypot(dx, dy) <= 10) {
          onNodeClick?.(node.node);
          break;
        }
      }
    },
    [layoutNodes, onNodeClick]
  );
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
              onMouseLeave: () => setHoveredNode(null),
              onClick: handleClick
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
function TreeCraft({
  data,
  renderNode,
  // collapse
  collapsible = true,
  defaultCollapsed = false,
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
  // zoom/pan
  zoomable = false
}) {
  const containerRef = useRef(null);
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
  const [collapsedIds, setCollapsedIds] = useState(initCollapsedIds);
  const [selectedIds, setSelectedIds] = useState(/* @__PURE__ */ new Set());
  const [internalFocusedId, setInternalFocusedId] = useState();
  const [internalHighlightPath, setInternalHighlightPath] = useState();
  const activeFocusedId = focusedNodeId !== void 0 ? focusedNodeId : internalFocusedId;
  const activeHighlightPath = highlightPath !== void 0 ? highlightPath : internalHighlightPath;
  const toggleCollapse = useCallback((id) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
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
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const handleWheel = useCallback(
    (e) => {
      if (!zoomable) return;
      e.preventDefault();
      setScale((s) => Math.min(3, Math.max(0.2, s - e.deltaY * 1e-3)));
    },
    [zoomable]
  );
  const handleMouseDown = useCallback(
    (e) => {
      if (!zoomable || e.button !== 0) return;
      isPanning.current = true;
      panStart.current = { x: e.clientX - translate.x, y: e.clientY - translate.y };
    },
    [zoomable, translate]
  );
  const handleMouseMove = useCallback((e) => {
    if (!isPanning.current) return;
    setTranslate({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
  }, []);
  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);
  const annotatedNodes = useMemo(() => annotate(toArray(data)), [data]);
  const rootClasses = [
    "tc-root",
    orientation === "horizontal" ? "tc-root--horizontal" : "",
    className
  ].filter(Boolean).join(" ");
  const innerStyle = zoomable ? {
    transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
    transformOrigin: "center center",
    cursor: isPanning.current ? "grabbing" : "grab"
  } : {};
  const durationStyle = animationDuration !== void 0 ? { "--tc-animation-duration": `${animationDuration}ms` } : {};
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: containerRef,
      className: rootClasses,
      style: { position: "relative", overflow: zoomable ? "hidden" : "auto", ...durationStyle, ...style },
      onWheel: zoomable ? handleWheel : void 0,
      onMouseDown: zoomable ? handleMouseDown : void 0,
      onMouseMove: zoomable ? handleMouseMove : void 0,
      onMouseUp: zoomable ? handleMouseUp : void 0,
      onMouseLeave: zoomable ? handleMouseUp : void 0,
      children: [
        /* @__PURE__ */ jsx("div", { className: "tc-canvas", style: innerStyle, children: /* @__PURE__ */ jsx("div", { className: annotatedNodes.length > 1 ? "tc-forest" : "tc-tree-wrapper", children: annotatedNodes.map((node) => /* @__PURE__ */ jsx(
          TreeBranch,
          {
            node,
            collapsedIds,
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
            onToggleSelect: toggleSelect
          },
          node.id
        )) }) }),
        miniMap && /* @__PURE__ */ jsx(
          MiniMap,
          {
            data,
            containerRef,
            orientation,
            focusedNodeId: activeFocusedId,
            highlightPathIds,
            selectedIds,
            position: miniMapPosition,
            onPositionChange: onMiniMapPositionChange,
            onNodeClick
          }
        )
      ]
    }
  );
}
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
    (nodeId, newParentId) => {
      setData((prev) => {
        const arr = toArray(prev);
        const updated = moveNode(arr, nodeId, newParentId);
        return isForest ? updated : updated[0];
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
    toFlat
  };
}

export { DefaultCollapseBtn, MiniMap, TreeConnector, TreeCraft, TreeSearch, addChildNode, annotate, buildTree, collectAllIds, collectDescendantIds, findNode, flattenTree, generateId, getPath, moveNode, removeNode, toArray, updateNodeData, useTreeCraft };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map