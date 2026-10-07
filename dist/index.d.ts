import React, { MouseEvent, ReactNode, CSSProperties } from 'react';

/** The universal tree node shape. T = whatever data your app needs. */
interface TreeNode<T = Record<string, unknown>> {
    id: string;
    data: T;
    children?: TreeNode<T>[];
}
/** Internal augmented node used by the engine (never exposed in consumer API) */
interface InternalNode<T = Record<string, unknown>> extends TreeNode<T> {
    _depth: number;
    _isRoot: boolean;
    _isLeaf: boolean;
    _path: string[];
    children: InternalNode<T>[];
}
interface RenderNodeProps<T = Record<string, unknown>> {
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
interface RenderCollapseBtnProps<T = Record<string, unknown>> {
    isCollapsed: boolean;
    node: TreeNode<T>;
    onToggle: (e: MouseEvent) => void;
}
interface TreeCraftTheme {
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
type AnimationPreset = 'fade' | 'slide' | 'zoom' | 'bounce' | 'flip' | 'blur' | 'none';
type Orientation = 'vertical' | 'horizontal';
type MiniMapPosition = 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
interface TreeCraftProps<T = Record<string, unknown>> {
    /** The root node of the tree (or an array of root nodes for a forest) */
    data: TreeNode<T> | TreeNode<T>[];
    /** Slot: render whatever JSX you want for each node */
    renderNode: (props: RenderNodeProps<T>) => ReactNode;
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
    /**
     * Show/hide connector lines between nodes.
     * @default true
     */
    showLines?: boolean;
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
    /**
     * Tree layout direction.
     * @default 'vertical'
     */
    orientation?: Orientation;
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
    /**
     * Only render nodes up to this depth.
     * Useful for performance or UI clarity.
     */
    maxDepth?: number;
    /**
     * Freeze all interactions. Connectors and layout still work.
     * @default false
     */
    readOnly?: boolean;
    /** Theme overrides. All CSS vars can also be set via stylesheet. */
    theme?: TreeCraftTheme;
    className?: string;
    style?: CSSProperties;
    nodeClassName?: string;
    nodeStyle?: CSSProperties;
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
    /**
     * Enable built-in scroll-to-zoom + drag-to-pan.
     * @default false
     */
    zoomable?: boolean;
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
type DropPosition = 'inside' | 'before' | 'after';
interface NodeMoveEvent {
    sourceId: string;
    targetId: string;
    position: DropPosition;
}
type CanDropFn = (sourceId: string, targetId: string, position: DropPosition) => boolean;
interface UseTreeCraftOptions<T = Record<string, unknown>> {
    initialData: TreeNode<T> | TreeNode<T>[];
}
interface UseTreeCraftReturn<T = Record<string, unknown>> {
    /** Current tree data (pass directly to <TreeCraft data={tree.data} />) */
    data: TreeNode<T> | TreeNode<T>[];
    /** Add a child node under parentId */
    addChild: (parentId: string, nodeData: T, id?: string) => void;
    /** Remove a node (and all its descendants) */
    removeNode: (id: string) => void;
    /** Update a node's data (shallow merge) */
    updateNode: (id: string, partialData: Partial<T>) => void;
    /** Move a node to a new parent or sibling position */
    moveNode: (nodeId: string, targetId: string, position?: DropPosition) => void;
    /** Ids of currently collapsed nodes */
    collapsedIds: Set<string>;
    collapse: (id: string) => void;
    expand: (id: string) => void;
    toggleCollapse: (id: string) => void;
    collapseAll: () => void;
    expandAll: () => void;
    selectedIds: Set<string>;
    select: (id: string) => void;
    deselect: (id: string) => void;
    toggleSelect: (id: string) => void;
    clearSelection: () => void;
    find: (id: string) => TreeNode<T> | null;
    getPath: (id: string) => TreeNode<T>[];
    toFlat: () => Array<TreeNode<T> & {
        parentId: string | null;
    }>;
    /** Replace the entire tree */
    setData: (data: TreeNode<T> | TreeNode<T>[]) => void;
}

declare function TreeCraft<T = Record<string, unknown>>({ data, renderNode, collapsible, defaultCollapsed, collapsedIds: propCollapsedIds, collapseDepth, renderCollapseButton, onCollapseChange, orientation, animationPreset, animationDuration, className, style, readOnly, selectable, selectPath, onSelect, onNodeClick, focusedNodeId, highlightPath, maxDepth, miniMap, miniMapPosition, onMiniMapPositionChange, draggableNodes, draggable, onNodeMove, canDrop, zoomable, }: TreeCraftProps<T>): React.JSX.Element;

interface TreeSearchProps<T> {
    /** Pass the same `data` you gave to <TreeCraft> */
    data: TreeNode<T> | TreeNode<T>[];
    /** Called with the nodeId when the user picks a result */
    onResult: (nodeId: string) => void;
    /** Map a node to searchable text — defaults to node.id */
    getLabel?: (node: TreeNode<T>) => string;
    placeholder?: string;
    className?: string;
}
declare function TreeSearch<T>({ data, onResult, getLabel, placeholder, className, }: TreeSearchProps<T>): React.JSX.Element;

interface MiniMapProps<T = Record<string, unknown>> {
    data: TreeNode<T> | TreeNode<T>[];
    containerRef?: React.RefObject<HTMLDivElement>;
    orientation?: 'vertical' | 'horizontal';
    focusedNodeId?: string;
    highlightPathIds?: Set<string>;
    selectedIds?: Set<string>;
    position?: MiniMapPosition;
    onPositionChange?: (position: MiniMapPosition) => void;
    scale?: number;
    translate?: {
        x: number;
        y: number;
    };
    onNavigate?: (x: number, y: number) => void;
    onNodeClick?: (node: TreeNode<T>) => void;
}
declare function MiniMap<T = Record<string, unknown>>({ data, containerRef, orientation, focusedNodeId, highlightPathIds, selectedIds, position, onPositionChange, onNodeClick, scale, translate, onNavigate, }: MiniMapProps<T>): React.JSX.Element;

interface Props {
    isCollapsed: boolean;
    onClick: (e: React.MouseEvent) => void;
    orientation?: 'vertical' | 'horizontal';
}
declare function DefaultCollapseBtn({ isCollapsed, onClick, orientation }: Props): React.JSX.Element;

interface TreeConnectorProps<T> {
    orientation: 'vertical' | 'horizontal';
    childrenRowRef: React.RefObject<HTMLDivElement>;
    childrenNodes: InternalNode<T>[];
    highlightPathIds?: Set<string>;
}
declare function TreeConnector<T>({ orientation, childrenRowRef, childrenNodes, highlightPathIds, }: TreeConnectorProps<T>): React.JSX.Element;

declare function useTreeCraft<T = Record<string, unknown>>(options: UseTreeCraftOptions<T>): UseTreeCraftReturn<T>;

/** Generate a collision-resistant id */
declare function generateId(): string;
/** Normalise: single root or forest → always work internally as an array */
declare function toArray<T>(data: TreeNode<T> | TreeNode<T>[]): TreeNode<T>[];
/** Annotate every node with depth / isRoot / isLeaf / path metadata */
declare function annotate<T>(nodes: TreeNode<T>[], depth?: number, path?: string[]): InternalNode<T>[];
/** Find a node by id — returns null if not found */
declare function findNode<T>(nodes: TreeNode<T>[], id: string): TreeNode<T> | null;
/** Get the ancestor chain from the root down to targetId (inclusive) */
declare function getPath<T>(nodes: TreeNode<T>[], targetId: string, ancestors?: TreeNode<T>[]): TreeNode<T>[] | null;
/** Collect all descendant ids of a node (including itself) */
declare function collectDescendantIds<T>(node: TreeNode<T>): string[];
/** Collect all ids in a tree */
declare function collectAllIds<T>(nodes: TreeNode<T>[]): string[];
/** Immutable: add a child node under parentId */
declare function addChildNode<T>(nodes: TreeNode<T>[], parentId: string, newNode: TreeNode<T>): TreeNode<T>[];
/** Immutable: remove a node and all its descendants */
declare function removeNode<T>(nodes: TreeNode<T>[], id: string): TreeNode<T>[];
/** Immutable: shallow-merge partialData into a node's data */
declare function updateNodeData<T>(nodes: TreeNode<T>[], id: string, partial: Partial<T>): TreeNode<T>[];
/** Immutable: move nodeId to be a child of targetId, or beside targetId ('before' | 'after') */
declare function moveNode<T>(nodes: TreeNode<T>[], nodeId: string, targetId: string, position?: 'inside' | 'before' | 'after'): TreeNode<T>[];
/** Flatten a tree → array of { ...node, parentId } */
declare function flattenTree<T>(nodes: TreeNode<T>[], parentId?: string | null): Array<TreeNode<T> & {
    parentId: string | null;
}>;
/** Build a tree from a flat list — each item must have { id, parentId } */
declare function buildTree<T extends {
    id: string;
}>(flat: Array<T & {
    parentId: string | null;
}>): TreeNode<T>[];

export { type AnimationPreset, DefaultCollapseBtn, type InternalNode, MiniMap, type MiniMapPosition, type Orientation, type RenderCollapseBtnProps, type RenderNodeProps, TreeConnector, TreeCraft, type TreeCraftProps, type TreeNode, TreeSearch, type UseTreeCraftOptions, type UseTreeCraftReturn, addChildNode, annotate, buildTree, collectAllIds, collectDescendantIds, findNode, flattenTree, generateId, getPath, moveNode, removeNode, toArray, updateNodeData, useTreeCraft };
