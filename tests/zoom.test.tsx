// @vitest-environment jsdom
//
//  Zoom / pan performance & correctness contracts
//
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TreeCraft } from '../src/components/TreeCraft';
import type { TreeNode, TreeCraftProps } from '../src/types';

interface Item {
  label: string;
}

// 1 root, 4 children, 3 grandchildren each → 17 nodes
const tree: TreeNode<Item> = {
  id: 'root',
  data: { label: 'root' },
  children: Array.from({ length: 4 }, (_, i) => ({
    id: `c${i}`,
    data: { label: `c${i}` },
    children: Array.from({ length: 3 }, (_, j) => ({ id: `c${i}-${j}`, data: { label: `c${i}-${j}` } })),
  })),
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Let rAF + React renders + effects run */
const settle = () => act(async () => { await sleep(40); });

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
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

function renderTree(props: Partial<TreeCraftProps<Item>> = {}, renderNode = vi.fn(({ node }) => <span>{node.data.label}</span>)) {
  act(() => {
    root.render(<TreeCraft<Item> data={tree} zoomable renderNode={renderNode} {...props} />);
  });
  return renderNode;
}

const viewport = () => container.querySelector('.tc-viewport') as HTMLElement;
const canvasScale = () => {
  const m = (container.querySelector('.tc-canvas') as HTMLElement).style.transform.match(/scale\(([^)]+)\)/);
  return m ? parseFloat(m[1]) : 1;
};

function wheel(deltaY = -100) {
  viewport().dispatchEvent(new WheelEvent('wheel', { deltaY, clientX: 0, clientY: 0, bubbles: true, cancelable: true }));
}

const STEP = Math.exp(100 * 0.0015); // scale multiplier for deltaY = -100

describe('zoom / pan', () => {
  it('does not re-render tree nodes while zooming', async () => {
    const renderNode = renderTree();
    await settle();
    const callsAfterMount = renderNode.mock.calls.length;

    for (let i = 0; i < 10; i++) {
      wheel();
      await settle();
    }

    expect(canvasScale()).toBeGreaterThan(1);
    expect(renderNode.mock.calls.length).toBe(callsAfterMount);
  });

  it('compounds consecutive wheel steps with no backward jumps', async () => {
    renderTree();
    await settle();

    const scales: number[] = [];
    for (let i = 0; i < 8; i++) {
      wheel();
      scales.push(canvasScale()); // read immediately: the DOM must already reflect this step
      await settle();
    }

    for (let i = 1; i < scales.length; i++) expect(scales[i]).toBeGreaterThan(scales[i - 1]);
    expect(canvasScale()).toBeCloseTo(STEP ** 8, 6);
  });

  it('keeps the live transform when TreeCraft re-renders mid-gesture', async () => {
    renderTree();
    await settle();

    wheel();
    wheel();
    wheel(); // no flush in between: a burst within one frame
    act(() => {
      root.render(
        <TreeCraft<Item> data={tree} zoomable lineColor="#ff0000" renderNode={({ node }) => <span>{node.data.label}</span>} />,
      );
    });
    expect(canvasScale()).toBeCloseTo(STEP ** 3, 6);

    wheel();
    await settle();
    expect(canvasScale()).toBeCloseTo(STEP ** 4, 6);
  });

  it('does not re-attach minimap listeners on every zoom step', async () => {
    renderTree({ miniMap: true });
    await settle();

    const addSpy = vi.spyOn(viewport(), 'addEventListener');
    for (let i = 0; i < 5; i++) {
      wheel();
      await settle();
    }
    const scrollListenerAdds = addSpy.mock.calls.filter(([type]) => type === 'scroll').length;
    expect(scrollListenerAdds).toBe(0);
  });

  it('does not repaint the minimap canvas during a zoom gesture', async () => {
    renderTree({ miniMap: true });
    await settle();

    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
    for (let i = 0; i < 5; i++) {
      wheel();
      await settle();
    }
    expect(getContext).not.toHaveBeenCalled();
  });

  it('marks the root as interacting during a gesture and clears it once settled', async () => {
    renderTree();
    await settle();
    const rootEl = container.querySelector('.tc-root') as HTMLElement;

    wheel();
    expect(rootEl.classList.contains('tc-root--interacting')).toBe(true);

    await act(async () => { await sleep(500); }); // > GESTURE_SETTLE_MS
    expect(rootEl.classList.contains('tc-root--interacting')).toBe(false);
  });

  it('resets to identity when zoom is turned off', async () => {
    renderTree();
    await settle();
    wheel();
    await settle();
    expect(canvasScale()).toBeGreaterThan(1);

    renderTree({ zoomable: false });
    await settle();
    expect((container.querySelector('.tc-canvas') as HTMLElement).style.transform).toBe('');
  });
});
