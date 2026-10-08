import React, { useRef, useState, useEffect } from 'react';
import { TreeCraft, TreeSearch, TreeExport, useTreeCraft } from 'react-treecraft';
import type {
  TreeNode,
  MiniMapPosition,
  TreeCraftRef,
  ExportFormat,
  ConnectorType,
  ConnectorPattern,
} from 'react-treecraft';

// ── Custom Dropdown ───────────────────────────────────────────
interface DropdownOption<T> {
  value: T;
  label: string;
  description?: string;
}

function StyledDropdown<T>({
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
        <span className="dropdown__value">{selected?.label ?? String(value)}</span>
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
              key={String(opt.value)}
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
  const initials = name ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : 'TC';
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
      <div className="node-card__name">{name || 'Unnamed Node'}</div>
      <div className="node-card__role">{role || 'Role'}</div>
    </div>
  );
}

// ── App Options ───────────────────────────────────────────────
type AnimPreset = 'fade' | 'slide' | 'zoom' | 'bounce' | 'flip' | 'blur' | 'none';
type Orientation = 'vertical' | 'horizontal';
type AnimDuration = 100 | 200 | 400 | 600 | 1000;
type LineRoundness = 0 | 6 | 12 | 20 | 32;
type LineThickness = 1 | 2 | 3 | 4 | 6;
type ColorPreset = '#94a3b8' | '#6366f1' | '#06b6d4' | '#10b981' | '#f59e0b' | '#f43f5e' | '#a855f7';
type NodeGap = 12 | 24 | 36 | 48 | 64;
type LevelGap = 20 | 36 | 48 | 64 | 80;

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
  { value: 100,  label: 'Fast',   description: '100ms' },
  { value: 200,  label: 'Normal', description: '200ms' },
  { value: 400,  label: 'Slow',   description: '400ms' },
  { value: 600,  label: 'Slower', description: '600ms' },
  { value: 1000, label: 'Glacial',description: '1000ms' },
];

const NODE_GAP_OPTIONS: DropdownOption<NodeGap>[] = [
  { value: 12, label: '12px (Tight)',    description: 'Compact side-by-side gap' },
  { value: 24, label: '24px (Normal)',   description: 'Default sibling spacing' },
  { value: 36, label: '36px (Relaxed)',  description: 'Spacious sibling spacing' },
  { value: 48, label: '48px (Wide)',     description: 'Wide sibling spacing' },
  { value: 64, label: '64px (X-Wide)',   description: 'Maximum sibling spacing' },
];

const LEVEL_GAP_OPTIONS: DropdownOption<LevelGap>[] = [
  { value: 20, label: '20px (Tight)',    description: 'Short connector height' },
  { value: 36, label: '36px (Normal)',   description: 'Default level distance' },
  { value: 48, label: '48px (Relaxed)',  description: 'Roomy parent-child gap' },
  { value: 64, label: '64px (Deep)',     description: 'Tall parent-child gap' },
  { value: 80, label: '80px (X-Deep)',   description: 'Maximum level distance' },
];

const MAP_POS_OPTIONS: DropdownOption<MiniMapPosition>[] = [
  { value: 'bottom-right', label: '↘ Bottom Right', description: 'Lower right corner' },
  { value: 'bottom-left',  label: '↙ Bottom Left',  description: 'Lower left corner' },
  { value: 'top-right',    label: '↗ Top Right',    description: 'Upper right corner' },
  { value: 'top-left',     label: '↖ Top Left',     description: 'Upper left corner' },
];

const CONNECTOR_TYPE_OPTIONS: DropdownOption<ConnectorType>[] = [
  { value: 'orthogonal', label: 'Orthogonal', description: 'Step line with 90° bends' },
  { value: 'curved',     label: 'Curved',     description: 'Smooth Bézier S-curves' },
  { value: 'straight',   label: 'Straight',   description: 'Direct diagonal lines' },
];

const PATTERN_OPTIONS: DropdownOption<ConnectorPattern>[] = [
  { value: 'solid',  label: 'Solid',  description: 'Clean continuous line' },
  { value: 'dashed', label: 'Dashed', description: 'Dashed stroke pattern' },
  { value: 'dotted', label: 'Dotted', description: 'Rounded dotted points' },
  { value: 'flow',   label: 'Flow',   description: 'Animated flowing pulses' },
];

const ROUNDNESS_OPTIONS: DropdownOption<LineRoundness>[] = [
  { value: 0,  label: 'Sharp (0px)',    description: 'Crisp 90° right angles' },
  { value: 6,  label: 'Subtle (6px)',   description: 'Small rounded corner' },
  { value: 12, label: 'Rounded (12px)', description: 'Balanced smooth corner' },
  { value: 20, label: 'Smooth (20px)',  description: 'Wide soft corner' },
  { value: 32, label: 'Extra (32px)',   description: 'Extra smooth bend' },
];

const THICKNESS_OPTIONS: DropdownOption<LineThickness>[] = [
  { value: 1, label: '1px (Thin)',   description: 'Fine wireframe' },
  { value: 2, label: '2px (Normal)', description: 'Standard line' },
  { value: 3, label: '3px (Medium)', description: 'Prominent stroke' },
  { value: 4, label: '4px (Thick)',  description: 'Heavy bold line' },
  { value: 6, label: '6px (Extra)',  description: 'Maximum thickness' },
];

const COLOR_OPTIONS: DropdownOption<ColorPreset>[] = [
  { value: '#94a3b8', label: '🔘 Slate',   description: 'Default slate line' },
  { value: '#6366f1', label: '🟣 Indigo',  description: 'Vibrant indigo line' },
  { value: '#06b6d4', label: '🔵 Cyan',    description: 'Neon cyan line' },
  { value: '#10b981', label: '🟢 Emerald', description: 'Emerald green line' },
  { value: '#f59e0b', label: '🟠 Amber',   description: 'Warm amber line' },
  { value: '#f43f5e', label: '🔴 Rose',    description: 'Electric rose line' },
  { value: '#a855f7', label: '💜 Purple',  description: 'Deep purple line' },
];

export default function App() {
  const tree = useTreeCraft<OrgNode>({ initialData: INITIAL_DATA });
  const treeRef = useRef<TreeCraftRef>(null);

  const [orientation, setOrientation] = useState<Orientation>('vertical');
  const [animPreset, setAnimPreset] = useState<AnimPreset>('fade');
  const [animDuration, setAnimDuration] = useState<AnimDuration>(200);
  const [selectPath, setSelectPath] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [miniMapPosition, setMiniMapPosition] = useState<MiniMapPosition>('bottom-right');
  const [zoomable, setZoomable] = useState(false);
  const [draggable, setDraggable] = useState(true);
  const [readOnly, setReadOnly] = useState(false);
  const [focusedId, setFocusedId] = useState<string | undefined>();
  const [highlightPath, setHighlightPath] = useState<string | undefined>();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Connector Customization State ──────────────────────────
  const [connectorType, setConnectorType] = useState<ConnectorType>('orthogonal');
  const [connectorPattern, setConnectorPattern] = useState<ConnectorPattern>('solid');
  const [lineRoundness, setLineRoundness] = useState<LineRoundness>(12);
  const [lineThickness, setLineThickness] = useState<LineThickness>(2);
  const [lineColor, setLineColor] = useState<ColorPreset>('#94a3b8');

  // ── Gap / Spacing Customization State ─────────────────────
  const [nodeGap, setNodeGap] = useState<NodeGap>(24);
  const [levelGap, setLevelGap] = useState<LevelGap>(36);

  const selectedCount = selectedIds.length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSearch = (id: string) => {
    setFocusedId(id);
    setHighlightPath(id);
    tree.expandAll();
  };

  const handleExportSuccess = (format: ExportFormat) => {
    showToast(`✓ Exported ${format.toUpperCase()} successfully!`);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header__logo">⚡ react-treecraft</div>
        <div className="header__controls">
          <TreeSearch
            data={tree.data}
            onResult={handleSearch}
            getLabel={(n) => {
              const d = n.data as OrgNode;
              return `${d.name ?? 'Node'} — ${d.role ?? ''}`;
            }}
            placeholder="Search members…"
          />

          <button
            className={`btn ${orientation === 'horizontal' ? 'btn--active' : ''}`}
            onClick={() => setOrientation((o) => o === 'vertical' ? 'horizontal' : 'vertical')}
          >
            {orientation === 'vertical' ? '↔ Horizontal' : '↕ Vertical'}
          </button>

          {/* Connector Routing Style */}
          <StyledDropdown<ConnectorType>
            label="Line Style"
            value={connectorType}
            options={CONNECTOR_TYPE_OPTIONS}
            onChange={setConnectorType}
          />

          {/* Corner Roundness (available for orthogonal lines) */}
          {connectorType === 'orthogonal' && (
            <StyledDropdown<LineRoundness>
              label="Corners"
              value={lineRoundness}
              options={ROUNDNESS_OPTIONS}
              onChange={setLineRoundness}
            />
          )}

          {/* Stroke Pattern */}
          <StyledDropdown<ConnectorPattern>
            label="Pattern"
            value={connectorPattern}
            options={PATTERN_OPTIONS}
            onChange={setConnectorPattern}
          />

          {/* Line Thickness */}
          <StyledDropdown<LineThickness>
            label="Width"
            value={lineThickness}
            options={THICKNESS_OPTIONS}
            onChange={setLineThickness}
          />

          {/* Line Color */}
          <StyledDropdown<ColorPreset>
            label="Color"
            value={lineColor}
            options={COLOR_OPTIONS}
            onChange={setLineColor}
          />

          {/* Sibling Node Gap */}
          <StyledDropdown<NodeGap>
            label="Node Gap"
            value={nodeGap}
            options={NODE_GAP_OPTIONS}
            onChange={setNodeGap}
          />

          {/* Parent-Child Level Gap */}
          <StyledDropdown<LevelGap>
            label="Level Gap"
            value={levelGap}
            options={LEVEL_GAP_OPTIONS}
            onChange={setLevelGap}
          />

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
            className={`btn ${draggable ? 'btn--active' : ''}`}
            onClick={() => setDraggable((d) => !d)}
          >
            {draggable ? '🖐️ Drag & Drop' : 'Drag & Drop'}
          </button>

          <button
            className={`btn ${readOnly ? 'btn--active' : ''}`}
            onClick={() => setReadOnly((r) => !r)}
          >
            {readOnly ? '🔒 ReadOnly' : 'ReadOnly'}
          </button>

          <button className="btn" onClick={tree.expandAll}>Expand All</button>
          <button className="btn" onClick={tree.collapseAll}>Collapse All</button>

          {/* Export & Import companion component */}
          <TreeExport<OrgNode>
            treeRef={treeRef}
            data={tree.data}
            filename="org-structure"
            backgroundColor="#0f172a"
            onExport={handleExportSuccess}
            onImport={(imported: TreeNode<OrgNode> | TreeNode<OrgNode>[]) => {
              tree.setData(imported);
              showToast('✓ Tree JSON imported successfully!');
            }}
          />

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

      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 64,
            right: 24,
            background: 'rgba(16, 185, 129, 0.95)',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            zIndex: 9999,
            fontWeight: 600,
            fontSize: 13,
            animation: 'tc-export-fade-in 150ms ease-out',
          }}
        >
          {toastMessage}
        </div>
      )}

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
            <span className="info-bar__item">
              Gap: <strong>{nodeGap}px</strong> siblings • <strong>{levelGap}px</strong> level
            </span>
            <span className="info-bar__item">
              Connector: <strong>{connectorType}</strong> ({connectorType === 'orthogonal' ? `${lineRoundness}px corner` : connectorType}) • <strong>{lineThickness}px</strong> • <strong>{connectorPattern}</strong>
            </span>
            <span className="info-bar__item">Animation: <strong>{animPreset}</strong> @ <strong>{animDuration}ms</strong></span>
          </div>

          <div className="tree-container" style={{ height: '70vh' }}>
            <TreeCraft<OrgNode>
              ref={treeRef}
              data={tree.data}
              orientation={orientation}
              animationPreset={animPreset}
              animationDuration={animDuration}
              connectorType={connectorType}
              connectorPattern={connectorPattern}
              lineRadius={lineRoundness}
              lineWidth={lineThickness}
              lineColor={lineColor}
              nodeGap={nodeGap}
              levelGap={levelGap}
              highlightColor="#38bdf8"
              collapsible
              collapsedIds={tree.collapsedIds}
              onCollapseChange={(id, collapsed) => (collapsed ? tree.collapse(id) : tree.expand(id))}
              defaultCollapsed={false}
              selectPath={selectPath}
              readOnly={readOnly}
              focusedNodeId={focusedId}
              highlightPath={highlightPath}
              miniMap={showMiniMap}
              miniMapPosition={miniMapPosition}
              onMiniMapPositionChange={setMiniMapPosition}
              zoomable={zoomable}
              draggableNodes={draggable}
              onNodeMove={(e) => {
                tree.moveNode(e.sourceId, e.targetId, e.position);
              }}
              onSelect={(ids) => setSelectedIds(ids)}
              onNodeClick={(node) => console.log('Node clicked:', node.id)}
              renderNode={({ node, isRoot, isLeaf, isSelected, isFocused }) => {
                const d = node.data as OrgNode;
                return (
                  <OrgNodeCard
                    name={d?.name ?? ''}
                    role={d?.role ?? ''}
                    isRoot={isRoot}
                    isLeaf={isLeaf}
                    isSelected={isSelected}
                    isFocused={isFocused}
                  />
                );
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
