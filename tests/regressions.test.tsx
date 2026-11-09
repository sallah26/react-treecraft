// @vitest-environment jsdom
//
//  Regression tests for the v0.3.0 bug-fix batch
//
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import React, { act, Profiler, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TreeCraft } from '../src/components/TreeCraft';
import { TreeSearch } from '../src/components/TreeSearch';
import { MiniMap } from '../src/components/MiniMap';
import { nodeSelector, queryNode } from '../src/utils/dom';
import type { TreeNode, TreeCraftRef } from '../src/types';

interface Org {
  title: string;
}

const singleRoot: TreeNode<Org> = {
  id: 'root',
  data: { title: 'CEO' },
  children: [
    { id: 'cto', data: { title: 'CTO' } },
    { id: 'cfo', data: { title: 'CFO' } },
  ],
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// jsdom lacks these browser APIs used by the layout / navigation code
beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
  if (typeof globalThis.requestAnimationFrame === 'undefined') {
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
      setTimeout(() => cb(Date.now()), 16) as unknown as number) as typeof requestAnimationFrame;
    globalThis.cancelAnimationFrame = ((id: number) => clearTimeout(id)) as typeof cancelAnimationFrame;
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = function scrollIntoView() {};
  }
  // jsdom logs "not implemented" for canvas; the MiniMap tolerates a null context
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
});

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

// ─ #1 TreeSearch render loop ─

describe('TreeSearch', () => {
  it('does not re-render endlessly when data is a single root object', async () => {
    // Real scheduler (no act) so a regression shows up as a high render count, not a hung test
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
    let renders = 0;
    root.render(
      <Profiler id="search" onRender={() => { renders += 1; }}>
        <TreeSearch<Org> data={singleRoot} onResult={() => {}} getLabel={(n) => n.data.title} />
      </Profiler>,
    );
    await sleep(100);
    expect(renders).toBeLessThanOrEqual(3);
    root.unmount(); // outside act() on purpose; afterEach's act-wrapped unmount is then a no-op
  });

  it('finds nodes in single-root data and picks with Enter', () => {
    const onResult = vi.fn();
    act(() => {
      root.render(<TreeSearch<Org> data={singleRoot} onResult={onResult} getLabel={(n) => n.data.title} />);
    });
    const input = container.querySelector('input')!;
    act(() => setInputValue(input, 'cf'));

    const items = container.querySelectorAll('.tc-search__result-item');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain('CFO');

    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    expect(onResult).toHaveBeenCalledWith('cfo');
    expect(input.value).toBe(''); // clearOnSelect default
  });
});

// ─ #2 multiSelect ─

function clickNode(id: string, init: MouseEventInit = {}) {
  const inner = container.querySelector(`${nodeSelector(id)} > .tc-node-inner`)!;
  act(() => {
    inner.dispatchEvent(new MouseEvent('click', { bubbles: true, ...init }));
  });
}

function renderSelectable(multiSelect: boolean, onSelect: (ids: string[]) => void) {
  act(() => {
    root.render(
      <TreeCraft<Org>
        data={singleRoot}
        selectable
        multiSelect={multiSelect}
        onSelect={onSelect}
        renderNode={({ node }) => <span>{node.data.title}</span>}
      />,
    );
  });
}

describe('selection', () => {
  it('plain click replaces the selection; clicking the sole selected node deselects it', () => {
    const onSelect = vi.fn();
    renderSelectable(false, onSelect);

    clickNode('cto');
    expect(onSelect).toHaveBeenLastCalledWith(['cto']);
    clickNode('cfo');
    expect(onSelect).toHaveBeenLastCalledWith(['cfo']);
    clickNode('cfo');
    expect(onSelect).toHaveBeenLastCalledWith([]);
  });

  it('ignores modifier keys when multiSelect is off', () => {
    const onSelect = vi.fn();
    renderSelectable(false, onSelect);

    clickNode('cto');
    clickNode('cfo', { shiftKey: true });
    expect(onSelect).toHaveBeenLastCalledWith(['cfo']);
  });

  it('adds / removes with Shift, Cmd or Ctrl when multiSelect is on', () => {
    const onSelect = vi.fn();
    renderSelectable(true, onSelect);

    clickNode('cto');
    clickNode('cfo', { shiftKey: true });
    expect(onSelect).toHaveBeenLastCalledWith(['cto', 'cfo']);
    clickNode('root', { metaKey: true });
    expect(onSelect).toHaveBeenLastCalledWith(['cto', 'cfo', 'root']);
    clickNode('cto', { ctrlKey: true });
    expect(onSelect).toHaveBeenLastCalledWith(['cfo', 'root']);
    // A plain click still collapses back to a single selection
    clickNode('cto');
    expect(onSelect).toHaveBeenLastCalledWith(['cto']);
  });

  it('marks the tree aria-multiselectable only when multiSelect applies', () => {
    renderSelectable(true, () => {});
    expect(container.querySelector('[role="tree"]')!.getAttribute('aria-multiselectable')).toBe('true');
    renderSelectable(false, () => {});
    expect(container.querySelector('[role="tree"]')!.hasAttribute('aria-multiselectable')).toBe(false);
  });
});

// ─ #3 documented defaults ─

describe('defaults', () => {
  it('starts expanded (defaultCollapsed = false)', () => {
    act(() => {
      root.render(<TreeCraft<Org> data={singleRoot} renderNode={({ node }) => <span>{node.data.title}</span>} />);
    });
    expect(queryNode(container, 'cto')).not.toBeNull();
    expect(queryNode(container, 'root')!.getAttribute('aria-expanded')).toBe('true');
  });
});

// ─ #7 selector escaping ─

describe('node id escaping', () => {
  const tricky: TreeNode<Org> = {
    id: 'root',
    data: { title: 'Root' },
    children: [{ id: 'say "hi" \\ there', data: { title: 'Quoted' } }],
  };

  it('scrollToNode works for ids containing quotes and backslashes', () => {
    const spy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    const ref = createRef<TreeCraftRef>();
    act(() => {
      root.render(<TreeCraft<Org> ref={ref} data={tricky} renderNode={({ node }) => <span>{node.data.title}</span>} />);
    });
    expect(() => ref.current!.scrollToNode('say "hi" \\ there')).not.toThrow();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(queryNode(container, 'say "hi" \\ there')?.textContent).toBe('Quoted');
  });
});

// ─ #5 MiniMap in zoom mode ─

describe('MiniMap node click', () => {
  // With a single node the minimap places it at (PADDING_X, PADDING_Y) = (16, 16);
  // jsdom bounding rects are all zero, so clientX/Y map 1:1 to canvas coordinates.
  const lone: TreeNode<Org> = { id: 'solo', data: { title: 'Solo' } };
  let host: HTMLDivElement;

  afterEach(() => host?.remove());

  function renderMiniMap(zoom: boolean, onNodeClick: () => void) {
    // Stand-in for the tree viewport, kept outside the React root's container
    host = document.createElement('div');
    host.innerHTML = '<div data-tc-node-id="solo"></div>';
    document.body.appendChild(host);
    const containerRef = { current: host };
    act(() => {
      root.render(
        <MiniMap<Org>
          data={lone}
          containerRef={containerRef}
          onNodeClick={onNodeClick}
          {...(zoom ? { scale: 1, translate: { x: 0, y: 0 }, onNavigate: () => {} } : {})}
        />,
      );
    });
    const canvas = container.querySelector('canvas')!;
    act(() => {
      canvas.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 16, clientY: 16 }));
    });
  }

  it('does not scrollIntoView in zoom/pan mode (transform owner navigates)', () => {
    const spy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    const onNodeClick = vi.fn();
    renderMiniMap(true, onNodeClick);
    expect(onNodeClick).toHaveBeenCalledTimes(1);
    expect(spy).not.toHaveBeenCalled();
  });

  it('still scrolls the node into view in plain scroll mode', () => {
    const spy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    const onNodeClick = vi.fn();
    renderMiniMap(false, onNodeClick);
    expect(onNodeClick).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

// ─ #6 MiniMap follows theme changes ─

describe('MiniMap theming', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--primary');
    document.documentElement.removeAttribute('class');
  });

  it('re-reads CSS variables when the <html> class changes', async () => {
    document.documentElement.style.setProperty('--primary', '#ff0000');
    act(() => {
      root.render(<MiniMap<Org> data={singleRoot} />);
    });
    const indicator = () => (container.querySelector('.tc-minimap__indicator') as HTMLElement).style.background;
    expect(indicator()).toBe('rgb(255, 0, 0)');

    await act(async () => {
      document.documentElement.style.setProperty('--primary', '#0000ff');
      document.documentElement.setAttribute('class', 'dark');
      await sleep(50); // MutationObserver + requestAnimationFrame coalescing
    });
    expect(indicator()).toBe('rgb(0, 0, 255)');
  });
});
