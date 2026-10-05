// ─────────────────────────────────────────────────────────────
//  TreeBranch — renders one node + its subtree recursively
// ─────────────────────────────────────────────────────────────
import React, { useRef, useLayoutEffect, useState } from 'react';
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
  isFirst,
  isLast,
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

  // CSS bar width calculation for multi-child horizontal connector
  const childrenRowRef = useRef<HTMLDivElement>(null);
  const [barStyle, setBarStyle] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
    if (!showChildren || children.length <= 1 || !childrenRowRef.current) return;
    const row = childrenRowRef.current;
    const childWrappers = Array.from(row.children) as HTMLElement[];
    if (childWrappers.length < 2) return;
    const firstRect = childWrappers[0].getBoundingClientRect();
    const lastRect = childWrappers[childWrappers.length - 1].getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const left = firstRect.left + firstRect.width / 2 - rowRect.left;
    const right = lastRect.left + lastRect.width / 2 - rowRect.left;
    setBarStyle({ left, width: right - left });
  }, [showChildren, children.length]);

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

  if (orientation === 'horizontal') {
    return (
      <div className="tc-branch">
        {/* Node */}
        <div className={nodeWrapperClasses}>
          <div
            className={`tc-node-inner ${selectable && !readOnly ? 'tc-node-inner--selectable' : ''}`}
            onClick={handleNodeClick}
          >
            {renderNode({
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
            })}
          </div>
          {collapseBtn}
        </div>

        {/* Children */}
        {showChildren && (
          <div className={`tc-children-row ${animClass}`} ref={childrenRowRef}>
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
        )}
      </div>
    );
  }

  // ── Vertical (default) layout ────────────────────────────────
  return (
    <div className="tc-branch">
      {/* Top stem (for non-root nodes) */}
      {!node._isRoot && (
        <div className={`tc-stem tc-stem--top ${isOnPath ? 'tc-stem--highlighted' : ''}`} />
      )}

      {/* Node */}
      <div className={nodeWrapperClasses} style={{ position: 'relative' }}>
        <div
          className={`tc-node-inner ${selectable && !readOnly ? 'tc-node-inner--selectable' : ''}`}
          onClick={handleNodeClick}
        >
          {renderNode({
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
          })}
        </div>
        {collapseBtn}
      </div>

      {/* Children section */}
      {showChildren && (
        <>
          {/* Bottom stem from node down to crossbar */}
          <div className={`tc-stem tc-stem--bottom ${isOnPath ? 'tc-stem--highlighted' : ''}`} />

          <div className={`tc-children-row ${children.length === 1 ? 'tc-single-child' : ''} ${animClass}`} ref={childrenRowRef}>
            {/* Horizontal crossbar (only for 2+ children) */}
            {children.length > 1 && (
              <div className={`tc-h-bar ${isOnPath ? 'tc-h-bar--highlighted' : ''}`} style={barStyle} />
            )}

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
        </>
      )}
    </div>
  );
}
