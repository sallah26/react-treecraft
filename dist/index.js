'use strict';

var react = require('react');
var jsxRuntime = require('react/jsx-runtime');
require('./index-62PKXS7E.css');

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
function TreeBranch({
  node,
  collapsedIds,
  selectedIds,
  focusedNodeId,
  highlightPathIds,
  collapsible,
  selectable,
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
  isFirst = false,
  isLast = false,
  siblingCount = 1
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
  const children = node.children ?? [];
  const animClass = animationPreset !== "none" ? `tc-anim-${animationPreset}-enter` : "";
  const handleCollapseClick = (e) => {
    e.stopPropagation();
    if (readOnly) return;
    onToggleCollapse(node.id);
    onCollapseChange?.(node.id, !isCollapsed);
  };
  const handleNodeClick = () => {
    if (readOnly) return;
    if (selectable) {
      onToggleSelect(node.id);
      onSelect?.([...selectedIds, node.id]);
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
  if (orientation === "horizontal") {
    const connectorClasses2 = [
      "tc-connector-h",
      siblingCount === 1 ? "tc-connector--single" : "",
      isFirst ? "tc-connector--first" : "",
      isLast ? "tc-connector--last" : "",
      isOnPath ? "tc-connector--highlighted" : ""
    ].filter(Boolean).join(" ");
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "tc-branch tc-branch--horizontal", children: [
      !node._isRoot && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: connectorClasses2, children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: "tc-crossbar-segment-h" }),
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: "tc-stem-right" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: nodeWrapperClasses, children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            className: `tc-node-inner ${selectable && !readOnly ? "tc-node-inner--selectable" : ""}`,
            onClick: handleNodeClick,
            children: renderedNodeContent
          }
        ),
        collapseBtn
      ] }),
      showChildren && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "tc-subtree tc-subtree--horizontal", children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: `tc-stem-parent-right ${isOnPath ? "tc-stem--highlighted" : ""}` }),
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: `tc-children-row tc-children-row--horizontal ${animClass}`, children: children.map((child, i) => /* @__PURE__ */ jsxRuntime.jsx(
          TreeBranch,
          {
            node: child,
            collapsedIds,
            selectedIds,
            focusedNodeId,
            highlightPathIds,
            collapsible,
            selectable,
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
            isFirst: i === 0,
            isLast: i === children.length - 1,
            siblingCount: children.length
          },
          child.id
        )) })
      ] })
    ] });
  }
  const connectorClasses = [
    "tc-connector-v",
    siblingCount === 1 ? "tc-connector--single" : "",
    isFirst ? "tc-connector--first" : "",
    isLast ? "tc-connector--last" : "",
    isOnPath ? "tc-connector--highlighted" : ""
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "tc-branch tc-branch--vertical", children: [
    !node._isRoot && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: connectorClasses, children: [
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "tc-crossbar-segment-v" }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "tc-stem-down" })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: nodeWrapperClasses, children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "div",
        {
          className: `tc-node-inner ${selectable && !readOnly ? "tc-node-inner--selectable" : ""}`,
          onClick: handleNodeClick,
          children: renderedNodeContent
        }
      ),
      collapseBtn
    ] }),
    showChildren && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "tc-subtree tc-subtree--vertical", children: [
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: `tc-stem-parent-down ${isOnPath ? "tc-stem--highlighted" : ""}` }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: `tc-children-row tc-children-row--vertical ${animClass}`, children: children.map((child, i) => /* @__PURE__ */ jsxRuntime.jsx(
        TreeBranch,
        {
          node: child,
          collapsedIds,
          selectedIds,
          focusedNodeId,
          highlightPathIds,
          collapsible,
          selectable,
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
          isFirst: i === 0,
          isLast: i === children.length - 1,
          siblingCount: children.length
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
var MINI_NODE_SIZE = 6;
var MINI_GAP_X = 18;
var MINI_GAP_Y = 14;
var CANVAS_W = 160;
var CANVAS_H = 100;
function MiniMap({
  data,
  containerRef,
  focusedNodeId,
  selectedIds,
  position = "bottom-right"
}) {
  const canvasRef = react.useRef(null);
  const dataArr = Array.isArray(data) ? data : [data];
  react.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    const flat = flattenTree(dataArr);
    const depthMap = {};
    const depthCount = {};
    flat.forEach((node) => {
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
    const levelIdx = {};
    flat.forEach((node) => {
      const depth = depthMap[node.id];
      levelIdx[depth] = (levelIdx[depth] ?? -1) + 1;
      const x = levelIdx[depth] * MINI_GAP_X * scaleX + 4;
      const y = depth * MINI_GAP_Y * scaleY + 4;
      ctx.fillStyle = node.id === focusedNodeId ? "#3b82f6" : selectedIds?.has(node.id) ? "#8b5cf6" : "#94a3b8";
      ctx.beginPath();
      ctx.arc(x + MINI_NODE_SIZE / 2, y + MINI_NODE_SIZE / 2, MINI_NODE_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [data, focusedNodeId, selectedIds]);
  const posStyle = {
    position: "absolute",
    zIndex: 100,
    background: "rgba(15,23,42,0.85)",
    border: "1px solid rgba(148,163,184,0.2)",
    borderRadius: 8,
    padding: 4,
    backdropFilter: "blur(4px)",
    ...position === "bottom-right" ? { bottom: 12, right: 12 } : {},
    ...position === "top-right" ? { top: 12, right: 12 } : {},
    ...position === "bottom-left" ? { bottom: 12, left: 12 } : {},
    ...position === "top-left" ? { top: 12, left: 12 } : {}
  };
  return /* @__PURE__ */ jsxRuntime.jsx("div", { style: posStyle, title: "Mini-map overview", children: /* @__PURE__ */ jsxRuntime.jsx("canvas", { ref: canvasRef, width: CANVAS_W, height: CANVAS_H }) });
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
  className = "",
  style,
  // features
  readOnly = false,
  selectable = false,
  onSelect,
  onNodeClick,
  focusedNodeId,
  highlightPath,
  maxDepth,
  miniMap = false,
  miniMapPosition = "bottom-right",
  // zoom/pan
  zoomable = false
}) {
  const containerRef = react.useRef(null);
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
  const [collapsedIds, setCollapsedIds] = react.useState(initCollapsedIds);
  const [selectedIds, setSelectedIds] = react.useState(/* @__PURE__ */ new Set());
  const toggleCollapse = react.useCallback((id) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const toggleSelect = react.useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onSelect?.([...next]);
      return next;
    });
  }, [onSelect]);
  const highlightPathIds = react.useMemo(() => {
    if (!highlightPath) return void 0;
    const arr = toArray(data);
    const chain = getPath(arr, highlightPath);
    return chain ? new Set(chain.map((n) => n.id)) : void 0;
  }, [highlightPath, data]);
  const [scale, setScale] = react.useState(1);
  const [translate, setTranslate] = react.useState({ x: 0, y: 0 });
  const isPanning = react.useRef(false);
  const panStart = react.useRef({ x: 0, y: 0 });
  const handleWheel = react.useCallback(
    (e) => {
      if (!zoomable) return;
      e.preventDefault();
      setScale((s) => Math.min(3, Math.max(0.2, s - e.deltaY * 1e-3)));
    },
    [zoomable]
  );
  const handleMouseDown = react.useCallback(
    (e) => {
      if (!zoomable || e.button !== 0) return;
      isPanning.current = true;
      panStart.current = { x: e.clientX - translate.x, y: e.clientY - translate.y };
    },
    [zoomable, translate]
  );
  const handleMouseMove = react.useCallback((e) => {
    if (!isPanning.current) return;
    setTranslate({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
  }, []);
  const handleMouseUp = react.useCallback(() => {
    isPanning.current = false;
  }, []);
  const annotatedNodes = react.useMemo(() => annotate(toArray(data)), [data]);
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
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      ref: containerRef,
      className: rootClasses,
      style: { position: "relative", overflow: zoomable ? "hidden" : "auto", ...style },
      onWheel: zoomable ? handleWheel : void 0,
      onMouseDown: zoomable ? handleMouseDown : void 0,
      onMouseMove: zoomable ? handleMouseMove : void 0,
      onMouseUp: zoomable ? handleMouseUp : void 0,
      onMouseLeave: zoomable ? handleMouseUp : void 0,
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: "tc-canvas", style: innerStyle, children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: annotatedNodes.length > 1 ? "tc-forest" : "tc-tree-wrapper", children: annotatedNodes.map((node) => /* @__PURE__ */ jsxRuntime.jsx(
          TreeBranch,
          {
            node,
            collapsedIds,
            selectedIds,
            focusedNodeId,
            highlightPathIds,
            collapsible,
            selectable,
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
        miniMap && /* @__PURE__ */ jsxRuntime.jsx(
          MiniMap,
          {
            data,
            containerRef,
            focusedNodeId,
            selectedIds,
            position: miniMapPosition
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
    (nodeId, newParentId) => {
      setData((prev) => {
        const arr = toArray(prev);
        const updated = moveNode(arr, nodeId, newParentId);
        return isForest ? updated : updated[0];
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

exports.DefaultCollapseBtn = DefaultCollapseBtn;
exports.MiniMap = MiniMap;
exports.TreeCraft = TreeCraft;
exports.TreeSearch = TreeSearch;
exports.addChildNode = addChildNode;
exports.annotate = annotate;
exports.buildTree = buildTree;
exports.collectAllIds = collectAllIds;
exports.collectDescendantIds = collectDescendantIds;
exports.findNode = findNode;
exports.flattenTree = flattenTree;
exports.generateId = generateId;
exports.getPath = getPath;
exports.moveNode = moveNode;
exports.removeNode = removeNode;
exports.toArray = toArray;
exports.updateNodeData = updateNodeData;
exports.useTreeCraft = useTreeCraft;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map