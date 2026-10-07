// ─────────────────────────────────────────────────────────────
//  TreeBranch — renders one node + its subtree recursively
// ─────────────────────────────────────────────────────────────
import React, { useRef } from 'react';
import type { InternalNode, TreeCraftProps } from '../types';
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
    return (
      <div className={`tc-branch tc-branch--horizontal ${animClass}`} style={animStyle}>
        {/* Node card */}
        <div className={nodeWrapperClasses} data-tc-node-id={node.id}>
          <div
            className={`tc-node-inner ${isClickSelectable ? 'tc-node-inner--selectable' : ''}`}
            onClick={handleNodeClick}
          >
            {renderedNodeContent}
          </div>
          {collapseBtn}
        </div>

        {/* Subtree (connector zone + children column) */}
        {showChildren && (
          <div className="tc-subtree tc-subtree--horizontal">
            <TreeConnector
              orientation={orientation}
              childrenRowRef={childrenRowRef}
              childrenNodes={children}
              highlightPathIds={highlightPathIds}
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
      {/* Node card */}
      <div className={nodeWrapperClasses} data-tc-node-id={node.id}>
        <div
          className={`tc-node-inner ${isClickSelectable ? 'tc-node-inner--selectable' : ''}`}
          onClick={handleNodeClick}
        >
          {renderedNodeContent}
        </div>
        {collapseBtn}
      </div>

      {/* Subtree (connector zone + children row) */}
      {showChildren && (
        <div className="tc-subtree tc-subtree--vertical">
          <TreeConnector
            orientation={orientation}
            childrenRowRef={childrenRowRef}
            childrenNodes={children}
            highlightPathIds={highlightPathIds}
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
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
