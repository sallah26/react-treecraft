import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TreeCraft } from '../src/components/TreeCraft';
import type { TreeNode, RenderNodeProps } from '../src/types';

interface TestNode {
  title: string;
}

const sampleTree: TreeNode<TestNode> = {
  id: 'root-1',
  data: { title: 'CEO' },
  children: [
    {
      id: 'child-1',
      data: { title: 'CTO' },
      children: [
        { id: 'subchild-1', data: { title: 'Staff Engineer' } },
      ],
    },
    {
      id: 'child-2',
      data: { title: 'CFO' },
    },
  ],
};

describe('WAI-ARIA Accessibility Primitives', () => {
  it('renders role="tree" with default accessible label on tree wrapper', () => {
    const html = renderToStaticMarkup(
      <TreeCraft<TestNode>
        data={sampleTree}
        renderNode={({ node }) => <div>{node.data.title}</div>}
      />,
    );

    expect(html).toContain('role="tree"');
    expect(html).toContain('aria-label="Hierarchical tree"');
  });

  it('allows custom ariaLabel and ariaLabelledBy', () => {
    const html = renderToStaticMarkup(
      <TreeCraft<TestNode>
        data={sampleTree}
        ariaLabel="Company Organization Hierarchy"
        ariaLabelledBy="org-title-id"
        renderNode={({ node }) => <div>{node.data.title}</div>}
      />,
    );

    expect(html).toContain('aria-label="Company Organization Hierarchy"');
    expect(html).toContain('aria-labelledby="org-title-id"');
  });

  it('automatically emits role="treeitem", aria-level, and aria-expanded on nodes', () => {
    const html = renderToStaticMarkup(
      <TreeCraft<TestNode>
        data={sampleTree}
        defaultCollapsed={false}
        renderNode={({ node }) => <div>{node.data.title}</div>}
      />,
    );

    // Root node
    expect(html).toContain('data-tc-node-id="root-1"');
    expect(html).toContain('role="treeitem"');
    expect(html).toContain('aria-level="1"');
    expect(html).toContain('aria-expanded="true"');

    // Child nodes at level 2
    expect(html).toContain('data-tc-node-id="child-1"');
    expect(html).toContain('aria-level="2"');

    // Subtree branch rows should have role="group"
    expect(html).toContain('role="group"');
  });

  it('provides getNodeProps to custom node renderers', () => {
    let capturedProps: any = null;

    renderToStaticMarkup(
      <TreeCraft<TestNode>
        data={sampleTree}
        renderNode={({ node, getNodeProps }: RenderNodeProps<TestNode>) => {
          if (node.id === 'root-1') {
            capturedProps = getNodeProps ? getNodeProps({ className: 'custom-card' }) : null;
          }
          return <div>{node.data.title}</div>;
        }}
      />,
    );

    expect(capturedProps).not.toBeNull();
    expect(capturedProps.role).toBe('treeitem');
    expect(capturedProps['aria-level']).toBe(1);
    expect(capturedProps['aria-expanded']).toBe(true); // defaultCollapsed is false by default
    expect(capturedProps['data-tc-node-id']).toBe('root-1');
    expect(capturedProps.className).toBe('custom-card');
  });
});
