// ─────────────────────────────────────────────────────────────
//  react-treecraft — Core TypeScript Types
// ─────────────────────────────────────────────────────────────

import type { CSSProperties, ReactNode, MouseEvent as ReactMouseEvent, RefObject } from 'react';

// ── 1. Data Model ──────────────────────────────────────────────────────────

/** The universal tree node shape. T = whatever data your app needs. */
export interface TreeNode<T = Record<string, unknown>> {
  id: string;
  data: T;
  children?: TreeNode<T>[];
}

/** Internal augmented node used by the engine (never exposed in consumer API) */
export interface InternalNode<T = Record<string, unknown>> extends TreeNode<T> {
  _depth: number;
  _isRoot: boolean;
  _isLeaf: boolean;
  _path: string[];         // ancestor id chain root → this node
  children: InternalNode<T>[];
}

// ── 2. Render Slot Props (what renderNode receives) ────────────────────────

export interface RenderNodeProps<T = Record<string, unknown>> {
  /** The current node's data */
  node: TreeNode<T>;
  /** Depth in tree: 0 = root, 1 = first level children, etc. */
  depth: number;
  /** Is this the root node? */
  isRoot: boolean;
  /** Does this node have no children? */
  isLeaf: boolean;
  /** The full ancestor id chain, root first */
  path: string[];
  /** Whether this node is currently collapsed */
  isCollapsed: boolean;
  /** Whether this node is currently focused/highlighted */
  isFocused: boolean;
  /** Whether this node is currently selected (when selectable=true) */
  isSelected: boolean;
  /** Whether this node lies on the highlighted ancestor path */
  isOnHighlightedPath: boolean;
  /** Alias for isOnHighlightedPath */
  isOnPath?: boolean;
  /** Programmatically toggle collapsed state of this node */
  toggleCollapse: () => void;
}

export interface RenderCollapseBtnProps<T = Record<string, unknown>> {
  isCollapsed: boolean;
  node: TreeNode<T>;
  onToggle: (e: ReactMouseEvent) => void;
}

// ── 3. Theme / Style ────────────────────────────────────────────────────────

export type ConnectorType = 'orthogonal' | 'curved' | 'straight';
export type ConnectorPattern = 'solid' | 'dashed' | 'dotted' | 'flow';

export interface TreeCraftTheme {
  /** Connector line color. Default: '#94a3b8' */
  lineColor?: string;
  /** Connector line thickness in px. Default: 2 */
  lineWidth?: number;
  /** Corner radius on connector lines in px (for orthogonal lines). Default: 8 */
  lineRadius?: number;
  /** Connector line routing style. Default: 'orthogonal' */
  lineType?: ConnectorType;
  /** Connector stroke pattern style. Default: 'solid' */
  linePattern?: ConnectorPattern;
  /** Highlight color for focused/selected ancestor path. Default: '#3b82f6' */
  highlightColor?: string;
  /** Gap between sibling nodes (horizontal). Default: 24 */
  nodeGap?: number;
  /** Gap between parent and child row (vertical). Default: 32 */
  levelGap?: number;
  /** Animation duration in ms. Default: 200 */
  animationDuration?: number;
  /** Mini-map custom background color override (defaults to var(--background)) */
  miniMapBackground?: string;
  /** Mini-map custom primary accent color override (defaults to var(--primary)) */
  miniMapPrimaryColor?: string;
  /** Mini-map custom border color override (defaults to var(--border)) */
  miniMapBorderColor?: string;
  /** Mini-map custom regular node color override */
  miniMapNodeColor?: string;
}

// ── 4. Animation ────────────────────────────────────────────────────────────

export type AnimationPreset = 'fade' | 'slide' | 'zoom' | 'bounce' | 'flip' | 'blur' | 'none';

// ── 5. Orientation ─────────────────────────────────────────────────────────

export type Orientation = 'vertical' | 'horizontal';

// ── 5b. MiniMap Position & Props ────────────────────────────────────────────

export type MiniMapPosition = 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';

export interface MiniMapProps<T = Record<string, unknown>> {
  /** The tree data (root node or array of roots) */
  data: TreeNode<T> | TreeNode<T>[];
  /** Ref to the scroll/viewport container element */
  containerRef?: RefObject<HTMLDivElement | null>;
  /** Tree layout orientation */
  orientation?: Orientation;
  /** Currently focused node ID */
  focusedNodeId?: string;
  /** Set of node IDs on the active ancestor path */
  highlightPathIds?: Set<string>;
  /** Set of selected node IDs */
  selectedIds?: Set<string>;
  /** Corner dock position */
  position?: MiniMapPosition;
  /** Callback when position changes via quadrant switcher */
  onPositionChange?: (position: MiniMapPosition) => void;
  /** Zoom scale factor (when zoomable is enabled) */
  scale?: number;
  /** Translation coordinates (when zoomable is enabled) */
  translate?: { x: number; y: number };
  /** Callback to pan/navigate viewport */
  onNavigate?: (x: number, y: number) => void;
  /** Callback when a node dot is clicked in the minimap */
  onNodeClick?: (node: TreeNode<T>) => void;
  /**
   * Primary accent color override.
   * If not provided, dynamically defaults to the project's `--primary` / `--color-primary` CSS variable, or `#60a5fa`.
   */
  primaryColor?: string;
  /**
   * Background color override.
   * If not provided, dynamically defaults to the project's `--background` / `--color-background` CSS variable, or `rgba(15, 23, 42, 0.88)`.
   */
  backgroundColor?: string;
  /**
   * Border color override.
   * If not provided, dynamically defaults to the project's `--border` / `--color-border` CSS variable, or `rgba(255, 255, 255, 0.1)`.
   */
  borderColor?: string;
  /**
   * Node dot color override.
   * If not provided, dynamically defaults to the project's `--tc-line-color` or theme-adaptive slate.
   */
  nodeColor?: string;
  /** Optional custom CSS class name */
  className?: string;
  /** Optional inline styles */
  style?: CSSProperties;
}

// ── 6. Main Component Props ────────────────────────────────────────────────

export interface TreeCraftProps<T = Record<string, unknown>> {
  // ── Required ──────────────────────────────────────────────
  /** The root node of the tree (or an array of root nodes for a forest) */
  data: TreeNode<T> | TreeNode<T>[];
  /** Slot: render whatever JSX you want for each node */
  renderNode: (props: RenderNodeProps<T>) => ReactNode;

  // ── Collapse Behaviour ────────────────────────────────────
  /**
   * Enable/disable the collapse feature entirely.
   * @default true
   */
  collapsible?: boolean;
  /**
   * All nodes start collapsed.
   * @default true
   */
  defaultCollapsed?: boolean;
  /**
   * Controlled set or array of collapsed node IDs.
   * When provided, TreeCraft operates in controlled collapse mode.
   */
  collapsedIds?: Set<string> | string[];
  /**
   * Auto-collapse nodes deeper than this level.
   * E.g. collapseDepth={2} → levels 0,1 open; level 2+ collapsed.
   */
  collapseDepth?: number;
  /**
   * Slot: replace the built-in chevron toggle button with your own.
   */
  renderCollapseButton?: (props: RenderCollapseBtnProps<T>) => ReactNode;
  /**
   * Called whenever a node's collapsed state changes.
   */
  onCollapseChange?: (nodeId: string, collapsed: boolean) => void;
  /** Called when any node is clicked */
  onNodeClick?: (node: TreeNode<T>) => void;

  // ── Connector Lines ───────────────────────────────────────
  /**
   * Show/hide connector lines between nodes.
   * @default true
   */
  showLines?: boolean;
  /**
   * Connector line routing style: 'orthogonal' | 'curved' | 'straight'.
   * @default 'orthogonal'
   */
  connectorType?: ConnectorType;
  /**
   * Connector stroke pattern: 'solid' | 'dashed' | 'dotted' | 'flow'.
   * @default 'solid'
   */
  connectorPattern?: ConnectorPattern;
  /**
   * Connector line color.
   * @default '#94a3b8'
   */
  lineColor?: string;
  /**
   * Connector line thickness in pixels.
   * @default 2
   */
  lineWidth?: number;
  /**
   * Corner radius / roundness in pixels for orthogonal connector lines.
   * Set to 0 for sharp 90-degree corners.
   * @default 8
   */
  lineRadius?: number;
  /**
   * Color for the highlighted/active ancestor path.
   * @default '#3b82f6'
   */
  highlightColor?: string;

  // ── Gap / Spacing Customization ───────────────────────────
  /**
   * Spacing between side-by-side sibling nodes on the same level in pixels.
   * In vertical orientation, this is the horizontal gap between sibling columns.
   * In horizontal orientation, this is the vertical gap between sibling rows.
   * Overrides theme.nodeGap and the --tc-node-gap CSS variable.
   * @default 24
   */
  nodeGap?: number;
  /**
   * Spacing between parent node and child level in pixels.
   * In vertical orientation, this is the vertical height of the connector zone.
   * In horizontal orientation, this is the horizontal width of the connector zone.
   * Overrides theme.levelGap and the --tc-level-gap CSS variable.
   * @default 36
   */
  levelGap?: number;

  // ── Animation ─────────────────────────────────────────────
  /**
   * Animation style for expand/collapse.
   * @default 'fade'
   */
  animationPreset?: AnimationPreset;
  /**
   * Duration of expand/collapse animations in milliseconds.
   * Overrides the --tc-animation-duration CSS variable.
   * @default 200
   */
  animationDuration?: number;

  // ── Orientation ───────────────────────────────────────────
  /**
   * Tree layout direction.
   * @default 'vertical'
   */
  orientation?: Orientation;

  // ── Selection ─────────────────────────────────────────────
  /**
   * Allow nodes to be clicked to select them individually.
   * @default false
   */
  selectable?: boolean;
  /**
   * Path selection mode: clicking a node selects/deselects its entire
   * ancestor path (from the root node down to the clicked node).
   * @default false
   */
  selectPath?: boolean;
  /**
   * Allow selecting multiple nodes with Shift+Click.
   * @default false
   */
  multiSelect?: boolean;
  /** Controlled selected node ids */
  selectedIds?: string[] | Set<string>;
  /** Called when selection changes */
  onSelect?: (ids: string[]) => void;

  // ── Focus & Highlight ─────────────────────────────────────
  /**
   * Programmatically focus/highlight a specific node id.
   * Also highlights the ancestor path to it.
   */
  focusedNodeId?: string;
  /**
   * Node id whose ancestor path to highlight (root → node).
   * Pass the same id as focusedNodeId for automatic path tracing.
   */
  highlightPath?: string;

  // ── Depth Limiting ────────────────────────────────────────
  /**
   * Only render nodes up to this depth.
   * Useful for performance or UI clarity.
   */
  maxDepth?: number;

  // ── Read Only ─────────────────────────────────────────────
  /**
   * Freeze all interactions. Connectors and layout still work.
   * @default false
   */
  readOnly?: boolean;

  // ── Theming ───────────────────────────────────────────────
  /** Theme overrides. All CSS vars can also be set via stylesheet. */
  theme?: TreeCraftTheme;

  // ── Style & Class ─────────────────────────────────────────
  className?: string;
  style?: CSSProperties;

  // ── Node wrapper class (applied to every node container) ──
  nodeClassName?: string;
  nodeStyle?: CSSProperties;

  // ── Drag & Drop ────────────────────────────────────────────
  /**
   * Enable drag-and-drop node reordering and reparenting.
   * @default false
   */
  draggableNodes?: boolean;
  /**
   * Alias for draggableNodes.
   * @default false
   */
  draggable?: boolean;
  /**
   * Called when a node is dragged and dropped onto or beside another node.
   */
  onNodeMove?: (event: NodeMoveEvent) => void;
  /**
   * Optional custom validator to allow or forbid dropping sourceId onto targetId.
   */
  canDrop?: CanDropFn;

  // ── Zoom / Pan ─────────────────────────────────────────────
  /**
   * Enable built-in scroll-to-zoom + drag-to-pan.
   * @default false
   */
  zoomable?: boolean;

  // ── Mini-Map ───────────────────────────────────────────────
  /**
   * Show a corner mini-map overview of the whole tree.
   * @default false
   */
  miniMap?: boolean;
  /** Mini-map corner position. @default 'bottom-right' */
  miniMapPosition?: MiniMapPosition;
  /** Called when the user changes the mini-map corner position */
  onMiniMapPositionChange?: (position: MiniMapPosition) => void;
  /** Mini-map custom background color override (defaults to var(--background)) */
  miniMapBackground?: string;
  /** Mini-map custom primary accent color override (defaults to var(--primary)) */
  miniMapPrimaryColor?: string;
  /** Mini-map custom border color override (defaults to var(--border)) */
  miniMapBorderColor?: string;
  /** Mini-map custom regular node color override */
  miniMapNodeColor?: string;
}

// ── Drag & Drop Types ──────────────────────────────────────────────────────

export type DropPosition = 'inside' | 'before' | 'after';

export interface NodeMoveEvent {
  sourceId: string;
  targetId: string;
  position: DropPosition;
}

export type CanDropFn = (sourceId: string, targetId: string, position: DropPosition) => boolean;

// ── 7. useTreeCraft Hook Types ─────────────────────────────────────────────

export interface UseTreeCraftOptions<T = Record<string, unknown>> {
  initialData: TreeNode<T> | TreeNode<T>[];
}

export interface UseTreeCraftReturn<T = Record<string, unknown>> {
  /** Current tree data (pass directly to <TreeCraft data={tree.data} />) */
  data: TreeNode<T> | TreeNode<T>[];

  // ── Mutations ──────────────────────────────────────────────
  /** Add a child node under parentId */
  addChild: (parentId: string, nodeData: T, id?: string) => void;
  /** Remove a node (and all its descendants) */
  removeNode: (id: string) => void;
  /** Update a node's data (shallow merge) */
  updateNode: (id: string, partialData: Partial<T>) => void;
  /** Move a node to a new parent or sibling position */
  moveNode: (nodeId: string, targetId: string, position?: DropPosition) => void;

  // ── Collapse State ─────────────────────────────────────────
  /** Ids of currently collapsed nodes */
  collapsedIds: Set<string>;
  collapse: (id: string) => void;
  expand: (id: string) => void;
  toggleCollapse: (id: string) => void;
  collapseAll: () => void;
  expandAll: () => void;

  // ── Selection State ────────────────────────────────────────
  selectedIds: Set<string>;
  select: (id: string) => void;
  deselect: (id: string) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;

  // ── Queries ────────────────────────────────────────────────
  find: (id: string) => TreeNode<T> | null;
  getPath: (id: string) => TreeNode<T>[];   // root → node chain
  toFlat: () => Array<TreeNode<T> & { parentId: string | null }>;

  // ── Utilities ──────────────────────────────────────────────
  /** Replace the entire tree */
  setData: (data: TreeNode<T> | TreeNode<T>[]) => void;
  /** Export tree data as JSON string */
  exportJson: (options?: JsonExportOptions) => string;
  /** Download tree data as JSON file */
  downloadJson: (filename?: string, options?: JsonExportOptions) => void;
  /** Import and set tree from a JSON string */
  importJson: (jsonString: string) => void;
}

// ── 8. Export Options & Types ──────────────────────────────────────────────

export type ExportFormat = 'png' | 'svg' | 'json';

export interface SvgExportOptions {
  /** Background color for the exported image. Default: 'transparent' */
  backgroundColor?: string;
  /** Padding in pixels around the tree diagram. Default: 32 */
  padding?: number;
  /** Title for the SVG element. Default: 'Tree Diagram' */
  title?: string;
  /** Extra CSS styles to inline in the exported SVG */
  customCss?: string;
  /** Whether to sanitize out cross-origin font/image URLs for canvas rasterization */
  safeForCanvas?: boolean;
}

export interface PngExportOptions extends SvgExportOptions {
  /** Resolution multiplier / DPI scale. Default: 2 */
  scale?: number;
  /** Image quality (0 to 1). Default: 1 */
  quality?: number;
}

export interface JsonExportOptions {
  /** Indentation spacing for JSON output. Default: 2 */
  indent?: number;
}

// ── 9. TreeCraft Ref API ───────────────────────────────────────────────────

export interface TreeCraftRef {
  /** The root container element */
  container: HTMLDivElement | null;
  /** The viewport element */
  viewport: HTMLDivElement | null;
  /** The canvas element */
  canvas: HTMLDivElement | null;
  /** Reset canvas zoom/pan state and center viewport */
  resetView: () => void;
  /** Scroll and center the viewport/canvas on a specific node */
  scrollToNode: (nodeId: string) => void;
  /** Programmatically select a node (and highlight path if selectPath is active) */
  selectNode: (nodeId: string) => void;
  /** Programmatically focus / highlight a node */
  focusNode: (nodeId: string) => void;
  /** Export current tree as high-resolution PNG data URL */
  exportPng: (options?: PngExportOptions) => Promise<string>;
  /** Download current tree as PNG file */
  downloadPng: (filename?: string, options?: PngExportOptions) => Promise<void>;
  /** Export current tree as standalone SVG string */
  exportSvg: (options?: SvgExportOptions) => Promise<string>;
  /** Download current tree as SVG file */
  downloadSvg: (filename?: string, options?: SvgExportOptions) => Promise<void>;
  /** Export tree data as JSON string */
  exportJson: (options?: JsonExportOptions) => string;
  /** Download tree data as JSON file */
  downloadJson: (filename?: string, options?: JsonExportOptions) => void;
}

// ── 10. TreeExport Companion Component Props ──────────────────────────────

export interface TreeExportProps<T = Record<string, unknown>> {
  /** Reference to the TreeCraft instance or container element */
  treeRef?: React.RefObject<TreeCraftRef | null> | TreeCraftRef | React.RefObject<HTMLElement | null>;
  /** Tree data (for JSON export) */
  data?: TreeNode<T> | TreeNode<T>[];
  /** Default filename prefix without extension */
  filename?: string;
  /** Additional CSS class */
  className?: string;
  /** Inline style overrides */
  style?: CSSProperties;
  /** Default background color for image exports */
  backgroundColor?: string;
  /** Default scale for PNG export */
  scale?: number;
  /** Enable built-in JSON file import button in menu. Default: true if onImport provided */
  allowImport?: boolean;
  /** Callback triggered when JSON tree is imported */
  onImport?: (data: TreeNode<T> | TreeNode<T>[]) => void;
  /** Callback triggered when an export completes */
  onExport?: (format: ExportFormat) => void;
}
