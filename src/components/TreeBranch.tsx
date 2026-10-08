// ─────────────────────────────────────────────────────────────
//  TreeBranch — renders one node + its subtree recursively
// ─────────────────────────────────────────────────────────────
import React, { useRef, useState } from 'react';
import type {
  InternalNode,
  TreeCraftProps,
  DropPosition,
  NodeMoveEvent,
  CanDropFn,
  ConnectorType,
  ConnectorPattern,
} from '../types';
import { DefaultCollapseBtn } from './DefaultCollapseBtn';
import { TreeConnector } from './TreeConnector';

interface TreeBranchProps<T> {
  node: InternalNode<T>;
  collapsedIds: Set<string>;
  selectedIds: Set<string>;
  focusedNodeId?: string;
  highlightPathIds?: Set<string>;
  collapsible: boolean;
  selectable: boolean;
  selectPath?: boolean;
  readOnly: boolean;
  orientation: 'vertical' | 'horizontal';
  animationPreset: 'fade' | 'slide' | 'zoom' | 'bounce' | 'flip' | 'blur' | 'none';
  maxDepth?: number;
  /** Index among siblings — used to stagger the entry animation. Undefined for root nodes. */
  childIndex?: number;
  renderNode: TreeCraftProps<T>['renderNode'];
  renderCollapseButton?: TreeCraftProps<T>['renderCollapseButton'];
  onCollapseChange?: TreeCraftProps<T>['onCollapseChange'];
  onSelect?: TreeCraftProps<T>['onSelect'];
  onNodeClick?: TreeCraftProps<T>['onNodeClick'];
  onToggleCollapse: (id: string) => void;
  onToggleSelect: (id: string, path: string[]) => void;
  // Connector styling
  connectorType?: ConnectorType;
  connectorPattern?: ConnectorPattern;
  lineRadius?: number;
  lineColor?: string;
  lineWidth?: number;
  highlightColor?: string;
  // Drag & Drop
  draggableNodes?: boolean;
  draggedNodeId?: string | null;
  draggedNodeDescendants?: Set<string>;
  onDragStartNode?: (id: string) => void;
  onDragEndNode?: () => void;
  onNodeMove?: (event: NodeMoveEvent) => void;
  canDrop?: CanDropFn;
}

export function TreeBranch<T>({
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
  connectorType = 'orthogonal',
  connectorPattern = 'solid',
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
  canDrop,
}: TreeBranchProps<T>) {
  const isCollapsed = collapsedIds.has(node.id);
  const isSelected = selectedIds.has(node.id);
  const isFocused = focusedNodeId === node.id;
  const isOnPath = highlightPathIds?.has(node.id) ?? false;
  const hasFocusPath = !!highlightPathIds && highlightPathIds.size > 0;
  const hasChildren = (node.children ?? []).length > 0;
  const depthLimited = maxDepth !== undefined && node._depth >= maxDepth;
  const showChildren = hasChildren && !isCollapsed && !depthLimited;
  const showCollapseBtn = collapsible && hasChildren && !depthLimited && !readOnly;

  const childrenRowRef = useRef<HTMLDivElement>(null);
  const children = (node.children ?? []) as InternalNode<T>[];

  // ── Drag & Drop state ─────────────────────────────────────────
  const [dropPosition, setDropPosition] = useState<DropPosition | null>(null);

  const isDraggingThis = draggedNodeId === node.id;
  const isDropTargetInvalid =
    !draggedNodeId ||
    draggedNodeId === node.id ||
    (draggedNodeDescendants?.has(node.id) ?? false);

  const handleDragStart = (e: React.DragEvent) => {
    if (readOnly || !draggableNodes) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea, a')) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', node.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStartNode?.(node.id);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setDropPosition(null);
    onDragEndNode?.();
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!draggableNodes || readOnly || isDropTargetInvalid) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    let pos: DropPosition = 'inside';

    if (orientation === 'vertical') {
      const xRatio = (e.clientX - rect.left) / rect.width;
      if (xRatio < 0.25) pos = 'before';
      else if (xRatio > 0.75) pos = 'after';
      else pos = 'inside';
    } else {
      const yRatio = (e.clientY - rect.top) / rect.height;
      if (yRatio < 0.25) pos = 'before';
      else if (yRatio > 0.75) pos = 'after';
      else pos = 'inside';
    }

    if (canDrop && draggedNodeId && !canDrop(draggedNodeId, node.id, pos)) {
      e.dataTransfer.dropEffect = 'none';
      setDropPosition(null);
      return;
    }

    e.dataTransfer.dropEffect = 'move';
    setDropPosition(pos);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!draggableNodes || readOnly || isDropTargetInvalid) return;
    e.preventDefault();
    e.stopPropagation();

    const sourceId = e.dataTransfer.getData('text/plain') || draggedNodeId;
    if (sourceId && sourceId !== node.id && dropPosition) {
      if (!canDrop || canDrop(sourceId, node.id, dropPosition)) {
        onNodeMove?.({ sourceId, targetId: node.id, position: dropPosition });
      }
    }
    setDropPosition(null);
    onDragEndNode?.();
  };

  // Stagger: each child animates 60ms after the previous one
  const STAGGER_MS = 60;
  const animClass = childIndex !== undefined && animationPreset !== 'none'
    ? `tc-anim-${animationPreset}-enter`
    : '';
  const animStyle: React.CSSProperties = animClass
    ? { animationDelay: `${childIndex! * STAGGER_MS}ms`, animationFillMode: 'both' }
    : {};

  const handleCollapseClick = (e: React.MouseEvent) => {
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
    onNodeClick?.(node as any);
  };

  const nodeWrapperClasses = [
    'tc-node-wrapper',
    isFocused ? 'tc-node-wrapper--focused' : '',
    isSelected ? 'tc-node-wrapper--selected' : '',
    isOnPath ? 'tc-node-wrapper--on-path' : '',
    hasFocusPath ? 'tc-has-focus-path' : '',
    draggableNodes && !readOnly ? 'tc-node-card--draggable' : '',
    isDraggingThis ? 'tc-node-card--dragging' : '',
    dropPosition === 'inside' ? 'tc-node-card--drop-inside' : '',
  ].filter(Boolean).join(' ');

  const collapseBtn = showCollapseBtn ? (
    renderCollapseButton ? (
      renderCollapseButton({ isCollapsed, onToggle: handleCollapseClick, node: node as any })
    ) : (
      <DefaultCollapseBtn
        isCollapsed={isCollapsed}
        onClick={handleCollapseClick}
        orientation={orientation}
      />
    )
  ) : null;

  const renderedNodeContent = renderNode({
    node: node as any,
    depth: node._depth,
    isRoot: node._isRoot,
    isLeaf: node._isLeaf,
    path: node._path,
    isCollapsed,
    isSelected,
    isFocused,
    isOnHighlightedPath: isOnPath,
    toggleCollapse: () => onToggleCollapse(node.id),
  });

  const nodeCardEl = (
    <div
      className={nodeWrapperClasses}
      data-tc-node-id={node.id}
      draggable={draggableNodes && !readOnly}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ position: 'relative' }}
    >
      {dropPosition === 'before' && (
        <div className="tc-drop-indicator tc-drop-indicator--before" />
      )}
      {dropPosition === 'after' && (
        <div className="tc-drop-indicator tc-drop-indicator--after" />
      )}
      <div
        className={`tc-node-inner ${isClickSelectable ? 'tc-node-inner--selectable' : ''}`}
        onClick={handleNodeClick}
      >
        {renderedNodeContent}
      </div>
      {collapseBtn}
    </div>
  );

  // ── Horizontal Layout ─────────────────────────────────────────
  if (orientation === 'horizontal') {
    return (
      <div className={`tc-branch tc-branch--horizontal ${animClass}`} style={animStyle}>
        {nodeCardEl}

        {/* Subtree (connector zone + children column) */}
        {showChildren && (
          <div className="tc-subtree tc-subtree--horizontal">
            <TreeConnector
              orientation={orientation}
              childrenRowRef={childrenRowRef}
              childrenNodes={children}
              highlightPathIds={highlightPathIds}
              connectorType={connectorType}
              connectorPattern={connectorPattern}
              lineRadius={lineRadius}
              lineColor={lineColor}
              lineWidth={lineWidth}
              highlightColor={highlightColor}
            />
            <div className="tc-children-row tc-children-row--horizontal" ref={childrenRowRef}>
              {children.map((child, idx) => (
                <TreeBranch
                  key={child.id}
                  node={child}
                  childIndex={idx}
                  collapsedIds={collapsedIds}
                  selectedIds={selectedIds}
                  focusedNodeId={focusedNodeId}
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
                  onToggleCollapse={onToggleCollapse}
                  onToggleSelect={onToggleSelect}
                  connectorType={connectorType}
                  connectorPattern={connectorPattern}
                  lineRadius={lineRadius}
                  lineColor={lineColor}
                  lineWidth={lineWidth}
                  highlightColor={highlightColor}
                  draggableNodes={draggableNodes}
                  draggedNodeId={draggedNodeId}
                  draggedNodeDescendants={draggedNodeDescendants}
                  onDragStartNode={onDragStartNode}
                  onDragEndNode={onDragEndNode}
                  onNodeMove={onNodeMove}
                  canDrop={canDrop}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Vertical (default) Layout ─────────────────────────────────
  return (
    <div className={`tc-branch tc-branch--vertical ${animClass}`} style={animStyle}>
      {nodeCardEl}

      {/* Subtree (connector zone + children row) */}
      {showChildren && (
        <div className="tc-subtree tc-subtree--vertical">
          <TreeConnector
            orientation={orientation}
            childrenRowRef={childrenRowRef}
            childrenNodes={children}
            highlightPathIds={highlightPathIds}
            connectorType={connectorType}
            connectorPattern={connectorPattern}
            lineRadius={lineRadius}
            lineColor={lineColor}
            lineWidth={lineWidth}
            highlightColor={highlightColor}
          />
          <div className="tc-children-row tc-children-row--vertical" ref={childrenRowRef}>
            {children.map((child, idx) => (
              <TreeBranch
                key={child.id}
                node={child}
                childIndex={idx}
                collapsedIds={collapsedIds}
                selectedIds={selectedIds}
                focusedNodeId={focusedNodeId}
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
                onToggleCollapse={onToggleCollapse}
                onToggleSelect={onToggleSelect}
                connectorType={connectorType}
                connectorPattern={connectorPattern}
                lineRadius={lineRadius}
                lineColor={lineColor}
                lineWidth={lineWidth}
                highlightColor={highlightColor}
                draggableNodes={draggableNodes}
                draggedNodeId={draggedNodeId}
                draggedNodeDescendants={draggedNodeDescendants}
                onDragStartNode={onDragStartNode}
                onDragEndNode={onDragEndNode}
                onNodeMove={onNodeMove}
                canDrop={canDrop}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
