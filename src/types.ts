// ─────────────────────────────────────────────────────────────
//  react-treecraft — Core TypeScript Types
// ─────────────────────────────────────────────────────────────

import type { CSSProperties, ReactNode, MouseEvent as ReactMouseEvent } from 'react';

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
  /** Programmatically toggle collapsed state of this node */
  toggleCollapse: () => void;
}

export interface RenderCollapseBtnProps<T = Record<string, unknown>> {
  isCollapsed: boolean;
  node: TreeNode<T>;
  onToggle: (e: ReactMouseEvent) => void;
}

// ── 3. Theme / Style ────────────────────────────────────────────────────────

export interface TreeCraftTheme {
  /** Connector line color. Default: '#94a3b8' */
  lineColor?: string;
  /** Connector line thickness in px. Default: 2 */
  lineWidth?: number;
  /** Corner radius on connector lines in px. Default: 8 */
  lineRadius?: number;
  /** Gap between sibling nodes (horizontal). Default: 24 */
  nodeGap?: number;
  /** Gap between parent and child row (vertical). Default: 32 */
  levelGap?: number;
  /** Animation duration in ms. Default: 200 */
  animationDuration?: number;
}

// ── 4. Animation ────────────────────────────────────────────────────────────

export type AnimationPreset = 'fade' | 'slide' | 'zoom' | 'bounce' | 'flip' | 'blur' | 'none';

// ── 5. Orientation ─────────────────────────────────────────────────────────

export type Orientation = 'vertical' | 'horizontal';

// ── 5b. MiniMap Position ────────────────────────────────────────────────────

export type MiniMapPosition = 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';

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
  selectedIds?: string[];
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
}
