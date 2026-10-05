// ─────────────────────────────────────────────────────────────
//  TreeBranch — renders one node + its subtree recursively
// ─────────────────────────────────────────────────────────────
import React from 'react';
import type { InternalNode, TreeCraftProps } from '../types';
import { DefaultCollapseBtn } from './DefaultCollapseBtn';

interface TreeBranchProps<T> {
  node: InternalNode<T>;
  collapsedIds: Set<string>;
  selectedIds: Set<string>;
  focusedNodeId?: string;
  highlightPathIds?: Set<string>;
  collapsible: boolean;
  selectable: boolean;
  readOnly: boolean;
  orientation: 'vertical' | 'horizontal';
  animationPreset: 'fade' | 'slide' | 'zoom' | 'none';
  maxDepth?: number;
  renderNode: TreeCraftProps<T>['renderNode'];
  renderCollapseButton?: TreeCraftProps<T>['renderCollapseButton'];
  onCollapseChange?: TreeCraftProps<T>['onCollapseChange'];
  onSelect?: TreeCraftProps<T>['onSelect'];
  onNodeClick?: TreeCraftProps<T>['onNodeClick'];
  onToggleCollapse: (id: string) => void;
  onToggleSelect: (id: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
  siblingCount?: number;
}

export function TreeBranch<T>({
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
  siblingCount = 1,
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

  const children = (node.children ?? []) as InternalNode<T>[];
  const animClass = animationPreset !== 'none' ? `tc-anim-${animationPreset}-enter` : '';

  const handleCollapseClick = (e: React.MouseEvent) => {
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
    onNodeClick?.(node as any);
  };

  const nodeWrapperClasses = [
    'tc-node-wrapper',
    isFocused ? 'tc-node-wrapper--focused' : '',
    isSelected ? 'tc-node-wrapper--selected' : '',
    isOnPath ? 'tc-node-wrapper--on-path' : '',
    hasFocusPath ? 'tc-has-focus-path' : '',
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

  // ── Horizontal Layout ─────────────────────────────────────────
  if (orientation === 'horizontal') {
    const connectorClasses = [
      'tc-connector-h',
      siblingCount === 1 ? 'tc-connector--single' : '',
      isFirst ? 'tc-connector--first' : '',
      isLast ? 'tc-connector--last' : '',
      isOnPath ? 'tc-connector--highlighted' : '',
    ].filter(Boolean).join(' ');

    return (
      <div className="tc-branch tc-branch--horizontal">
        {/* Left incoming connector from parent crossbar */}
        {!node._isRoot && (
          <div className={connectorClasses}>
            <div className="tc-crossbar-segment-h" />
            <div className="tc-stem-right" />
          </div>
        )}

        {/* Node card */}
        <div className={nodeWrapperClasses}>
          <div
            className={`tc-node-inner ${selectable && !readOnly ? 'tc-node-inner--selectable' : ''}`}
            onClick={handleNodeClick}
          >
            {renderedNodeContent}
          </div>
          {collapseBtn}
        </div>

        {/* Subtree (outgoing right stem + children column) */}
        {showChildren && (
          <div className="tc-subtree tc-subtree--horizontal">
            <div className={`tc-stem-parent-right ${isOnPath ? 'tc-stem--highlighted' : ''}`} />
            <div className={`tc-children-row tc-children-row--horizontal ${animClass}`}>
              {children.map((child, i) => (
                <TreeBranch
                  key={child.id}
                  node={child}
                  collapsedIds={collapsedIds}
                  selectedIds={selectedIds}
                  focusedNodeId={focusedNodeId}
                  highlightPathIds={highlightPathIds}
                  collapsible={collapsible}
                  selectable={selectable}
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
                  isFirst={i === 0}
                  isLast={i === children.length - 1}
                  siblingCount={children.length}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Vertical (default) Layout ─────────────────────────────────
  const connectorClasses = [
    'tc-connector-v',
    siblingCount === 1 ? 'tc-connector--single' : '',
    isFirst ? 'tc-connector--first' : '',
    isLast ? 'tc-connector--last' : '',
    isOnPath ? 'tc-connector--highlighted' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="tc-branch tc-branch--vertical">
      {/* Top incoming connector from parent crossbar */}
      {!node._isRoot && (
        <div className={connectorClasses}>
          <div className="tc-crossbar-segment-v" />
          <div className="tc-stem-down" />
        </div>
      )}

      {/* Node card */}
      <div className={nodeWrapperClasses}>
        <div
          className={`tc-node-inner ${selectable && !readOnly ? 'tc-node-inner--selectable' : ''}`}
          onClick={handleNodeClick}
        >
          {renderedNodeContent}
        </div>
        {collapseBtn}
      </div>

      {/* Subtree (outgoing bottom stem + children row) */}
      {showChildren && (
        <div className="tc-subtree tc-subtree--vertical">
          <div className={`tc-stem-parent-down ${isOnPath ? 'tc-stem--highlighted' : ''}`} />
          <div className={`tc-children-row tc-children-row--vertical ${animClass}`}>
            {children.map((child, i) => (
              <TreeBranch
                key={child.id}
                node={child}
                collapsedIds={collapsedIds}
                selectedIds={selectedIds}
                focusedNodeId={focusedNodeId}
                highlightPathIds={highlightPathIds}
                collapsible={collapsible}
                selectable={selectable}
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
                isFirst={i === 0}
                isLast={i === children.length - 1}
                siblingCount={children.length}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
