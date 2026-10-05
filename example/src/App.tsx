import React, { useState } from 'react';
import { TreeCraft, TreeSearch, useTreeCraft } from 'react-treecraft';
import type { TreeNode } from 'react-treecraft';

// ── Sample Data ───────────────────────────────────────────────
interface OrgNode {
  name: string;
  role: string;
  avatar?: string;
}

const INITIAL_DATA: TreeNode<OrgNode> = {
  id: 'ceo',
  data: { name: 'Sarah Chen', role: 'Chief Executive Officer' },
  children: [
    {
      id: 'cto',
      data: { name: 'Alex Rivera', role: 'Chief Technology Officer' },
      children: [
        {
          id: 'eng-lead-1',
          data: { name: 'Jordan Park', role: 'Engineering Lead' },
          children: [
            { id: 'fe1', data: { name: 'Maya Patel', role: 'Frontend Engineer' }, children: [] },
            { id: 'fe2', data: { name: 'Liam Torres', role: 'Frontend Engineer' }, children: [] },
            { id: 'be1', data: { name: 'Emma Wilson', role: 'Backend Engineer' }, children: [] },
          ],
        },
        {
          id: 'eng-lead-2',
          data: { name: 'Sam Lee', role: 'Platform Lead' },
          children: [
            { id: 'de1', data: { name: 'Chris Nguyen', role: 'DevOps Engineer' }, children: [] },
            { id: 'de2', data: { name: 'Ava Johnson', role: 'SRE' }, children: [] },
          ],
        },
      ],
    },
    {
      id: 'cmo',
      data: { name: 'Taylor Kim', role: 'Chief Marketing Officer' },
      children: [
        { id: 'mkt1', data: { name: 'Noah Davis', role: 'Brand Manager' }, children: [] },
        { id: 'mkt2', data: { name: 'Zoe Martinez', role: 'Growth Lead' }, children: [] },
      ],
    },
    {
      id: 'cfo',
      data: { name: 'Riley Brown', role: 'Chief Financial Officer' },
      children: [
        { id: 'fin1', data: { name: 'Luke Anderson', role: 'Financial Analyst' }, children: [] },
      ],
    },
  ],
};

// ── Node Card Component ───────────────────────────────────────
function OrgNodeCard({
  name,
  role,
  isRoot,
  isLeaf,
  isSelected,
  isFocused,
}: {
  name: string;
  role: string;
  isRoot: boolean;
  isLeaf: boolean;
  isSelected: boolean;
  isFocused: boolean;
}) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const classes = [
    'node-card',
    isRoot ? 'node-card--root' : '',
    isLeaf ? 'node-card--leaf' : '',
    isSelected ? 'node-card--selected' : '',
    isFocused ? 'node-card--focused' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className="node-card__avatar">{initials}</div>
      <div className="node-card__name">{name}</div>
      <div className="node-card__role">{role}</div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────
type AnimPreset = 'fade' | 'slide' | 'zoom' | 'none';
type Orientation = 'vertical' | 'horizontal';

export default function App() {
  const tree = useTreeCraft<OrgNode>({ initialData: INITIAL_DATA });

  const [orientation, setOrientation] = useState<Orientation>('vertical');
  const [animPreset, setAnimPreset] = useState<AnimPreset>('fade');
  const [selectable, setSelectable] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [zoomable, setZoomable] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [focusedId, setFocusedId] = useState<string | undefined>();
  const [highlightPath, setHighlightPath] = useState<string | undefined>();

  const selectedCount = tree.selectedIds.size;

  const handleSearch = (id: string) => {
    setFocusedId(id);
    setHighlightPath(id);
    tree.expandAll();
  };

  const addRandomNode = () => {
    const ids = tree.toFlat().map((n) => n.id);
    const parentId = ids[Math.floor(Math.random() * ids.length)];
    tree.addChild(parentId, {
      name: `New Member ${Math.floor(Math.random() * 100)}`,
      role: 'Team Member',
    });
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header__logo">⚡ react-treecraft</div>
        <div className="header__controls">
          <TreeSearch
            data={tree.data}
            onResult={handleSearch}
            getLabel={(n) => `${(n.data as OrgNode).name} — ${(n.data as OrgNode).role}`}
            placeholder="Search members…"
          />

          <button
            className={`btn ${orientation === 'horizontal' ? 'btn--active' : ''}`}
            onClick={() => setOrientation((o) => o === 'vertical' ? 'horizontal' : 'vertical')}
          >
            {orientation === 'vertical' ? '↔ Horizontal' : '↕ Vertical'}
          </button>

          <select
            className="btn"
            value={animPreset}
            onChange={(e) => setAnimPreset(e.target.value as AnimPreset)}
          >
            <option value="fade">Anim: Fade</option>
            <option value="slide">Anim: Slide</option>
            <option value="zoom">Anim: Zoom</option>
            <option value="none">Anim: None</option>
          </select>

          <button
            className={`btn ${selectable ? 'btn--active' : ''}`}
            onClick={() => setSelectable((s) => !s)}
          >
            {selectable ? '✓ Selectable' : 'Selectable'}
          </button>

          <button
            className={`btn ${showMiniMap ? 'btn--active' : ''}`}
            onClick={() => setShowMiniMap((m) => !m)}
          >
            MiniMap
          </button>

          <button
            className={`btn ${zoomable ? 'btn--active' : ''}`}
            onClick={() => setZoomable((z) => !z)}
          >
            Zoom/Pan
          </button>

          <button
            className={`btn ${readOnly ? 'btn--active' : ''}`}
            onClick={() => setReadOnly((r) => !r)}
          >
            {readOnly ? '🔒 ReadOnly' : 'ReadOnly'}
          </button>

          <button className="btn" onClick={tree.expandAll}>Expand All</button>
          <button className="btn" onClick={tree.collapseAll}>Collapse All</button>
          <button className="btn" onClick={addRandomNode}>+ Add Node</button>

          {focusedId && (
            <button
              className="btn btn--danger"
              onClick={() => { setFocusedId(undefined); setHighlightPath(undefined); }}
            >
              Clear Focus
            </button>
          )}
        </div>
      </header>

      <main className="canvas">
        <div className="canvas__inner">
          <div className="info-bar">
            <span className="info-bar__item">Nodes: <strong>{tree.toFlat().length}</strong></span>
            {selectedCount > 0 && (
              <span className="info-bar__item">
                Selected: <strong>{selectedCount}</strong>
                <button className="btn btn--danger" style={{ marginLeft: 8, padding: '2px 8px', fontSize: 11 }} onClick={tree.clearSelection}>✕</button>
              </span>
            )}
            {focusedId && (
              <span className="info-bar__item">Focused: <strong>{focusedId}</strong></span>
            )}
            <span className="info-bar__item">Orientation: <strong>{orientation}</strong></span>
            <span className="info-bar__item">Animation: <strong>{animPreset}</strong></span>
          </div>

          <div className="tree-container" style={{ height: zoomable ? '70vh' : 'auto' }}>
            <TreeCraft<OrgNode>
              data={tree.data}
              orientation={orientation}
              animationPreset={animPreset}
              collapsible
              defaultCollapsed={false}
              selectable={selectable}
              readOnly={readOnly}
              focusedNodeId={focusedId}
              highlightPath={highlightPath}
              miniMap={showMiniMap}
              miniMapPosition="bottom-right"
              zoomable={zoomable}
              onSelect={(ids) => console.log('Selected:', ids)}
              onCollapseChange={(id, collapsed) => console.log('Collapse:', id, collapsed)}
              onNodeClick={(node) => {
                setFocusedId(node.id);
                setHighlightPath(node.id);
              }}
              renderNode={({ node, isRoot, isLeaf, isSelected, isFocused }) => (
                <OrgNodeCard
                  name={(node.data as OrgNode).name}
                  role={(node.data as OrgNode).role}
                  isRoot={isRoot}
                  isLeaf={isLeaf}
                  isSelected={isSelected}
                  isFocused={isFocused}
                />
              )}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
