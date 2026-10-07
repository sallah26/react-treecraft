import React, { useRef, useState, useEffect } from 'react';
import { TreeCraft, TreeSearch, useTreeCraft } from 'react-treecraft';
import type { TreeNode, MiniMapPosition } from 'react-treecraft';

// ── Custom Dropdown ───────────────────────────────────────────
interface DropdownOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

function StyledDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="dropdown" ref={ref}>
      <button
        className={`btn dropdown__trigger ${open ? 'btn--active' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="dropdown__label">{label}:</span>
        <span className="dropdown__value">{selected?.label ?? value}</span>
        <svg
          className={`dropdown__chevron ${open ? 'dropdown__chevron--open' : ''}`}
          width="10" height="10" viewBox="0 0 10 10" fill="none"
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="dropdown__menu">
          {options.map((opt) => (
            <button
              key={opt.value}
              className={`dropdown__item ${opt.value === value ? 'dropdown__item--active' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              <span className="dropdown__item-label">{opt.label}</span>
              {opt.description && (
                <span className="dropdown__item-desc">{opt.description}</span>
              )}
              {opt.value === value && (
                <svg className="dropdown__item-check" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
type AnimPreset = 'fade' | 'slide' | 'zoom' | 'bounce' | 'flip' | 'blur' | 'none';
type Orientation = 'vertical' | 'horizontal';
type AnimDuration = '100' | '200' | '400' | '600' | '1000';

const ANIM_OPTIONS: DropdownOption<AnimPreset>[] = [
  { value: 'fade',   label: 'Fade',   description: 'Opacity in/out' },
  { value: 'slide',  label: 'Slide',  description: 'Drop from above' },
  { value: 'zoom',   label: 'Zoom',   description: 'Scale in/out' },
  { value: 'bounce', label: 'Bounce', description: 'Spring overshoot' },
  { value: 'flip',   label: 'Flip',   description: '3D Y-axis rotate' },
  { value: 'blur',   label: 'Blur',   description: 'Blur + fade in' },
  { value: 'none',   label: 'None',   description: 'No animation' },
];

const DURATION_OPTIONS: DropdownOption<AnimDuration>[] = [
  { value: '100',  label: 'Fast',   description: '100ms' },
  { value: '200',  label: 'Normal', description: '200ms' },
  { value: '400',  label: 'Slow',   description: '400ms' },
  { value: '600',  label: 'Slower', description: '600ms' },
  { value: '1000', label: 'Glacial',description: '1000ms' },
];

const MAP_POS_OPTIONS: DropdownOption<MiniMapPosition>[] = [
  { value: 'bottom-right', label: '↘ Bottom Right', description: 'Lower right corner' },
  { value: 'bottom-left',  label: '↙ Bottom Left',  description: 'Lower left corner' },
  { value: 'top-right',    label: '↗ Top Right',    description: 'Upper right corner' },
  { value: 'top-left',     label: '↖ Top Left',     description: 'Upper left corner' },
];

export default function App() {
  const tree = useTreeCraft<OrgNode>({ initialData: INITIAL_DATA });

  const [orientation, setOrientation] = useState<Orientation>('vertical');
  const [animPreset, setAnimPreset] = useState<AnimPreset>('fade');
  const [animDuration, setAnimDuration] = useState<AnimDuration>('200');
  const [selectPath, setSelectPath] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [miniMapPosition, setMiniMapPosition] = useState<MiniMapPosition>('bottom-right');
  const [zoomable, setZoomable] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [focusedId, setFocusedId] = useState<string | undefined>();
  const [highlightPath, setHighlightPath] = useState<string | undefined>();

  const selectedCount = selectedIds.length;

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

          <StyledDropdown<AnimPreset>
            label="Anim"
            value={animPreset}
            options={ANIM_OPTIONS}
            onChange={setAnimPreset}
          />

          <StyledDropdown<AnimDuration>
            label="Duration"
            value={animDuration}
            options={DURATION_OPTIONS}
            onChange={setAnimDuration}
          />

          <button
            className={`btn ${selectPath ? 'btn--active' : ''}`}
            onClick={() => {
              setSelectPath((s) => {
                const next = !s;
                if (!next) {
                  setFocusedId(undefined);
                  setHighlightPath(undefined);
                  setSelectedIds([]);
                  tree.clearSelection();
                }
                return next;
              });
            }}
          >
            {selectPath ? '✓ Path Selection' : 'Path Selection'}
          </button>

          <button
            className={`btn ${showMiniMap ? 'btn--active' : ''}`}
            onClick={() => setShowMiniMap((m) => !m)}
          >
            {showMiniMap ? '✓ MiniMap' : 'MiniMap'}
          </button>

          {showMiniMap && (
            <StyledDropdown<MiniMapPosition>
              label="Map Pos"
              value={miniMapPosition}
              options={MAP_POS_OPTIONS}
              onChange={setMiniMapPosition}
            />
          )}

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
              onClick={() => { setFocusedId(undefined); setHighlightPath(undefined); setSelectedIds([]); }}
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
                <button
                  className="btn btn--danger"
                  style={{ marginLeft: 8, padding: '2px 8px', fontSize: 11 }}
                  onClick={() => {
                    setSelectedIds([]);
                    setFocusedId(undefined);
                    setHighlightPath(undefined);
                    tree.clearSelection();
                  }}
                >
                  ✕
                </button>
              </span>
            )}
            {focusedId && (
              <span className="info-bar__item">Focused: <strong>{focusedId}</strong></span>
            )}
            <span className="info-bar__item">Orientation: <strong>{orientation}</strong></span>
            <span className="info-bar__item">Animation: <strong>{animPreset}</strong> @ <strong>{animDuration}ms</strong></span>
          </div>

          <div className="tree-container" style={{ height: zoomable ? '70vh' : 'auto' }}>
            <TreeCraft<OrgNode>
              data={tree.data}
              orientation={orientation}
              animationPreset={animPreset}
              animationDuration={Number(animDuration)}
              collapsible
              defaultCollapsed={false}
              selectPath={selectPath}
              readOnly={readOnly}
              focusedNodeId={focusedId}
              highlightPath={highlightPath}
              miniMap={showMiniMap}
              miniMapPosition={miniMapPosition}
              onMiniMapPositionChange={setMiniMapPosition}
              zoomable={zoomable}
              onSelect={(ids) => setSelectedIds(ids)}
              onCollapseChange={(id, collapsed) => console.log('Collapse:', id, collapsed)}
              onNodeClick={(node) => console.log('Node clicked:', node.id)}
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


