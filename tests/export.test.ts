import { describe, it, expect } from 'vitest';
import { exportToJson, importFromJson } from '../src/utils/export';
import type { TreeNode } from '../src/types';

interface TestNode {
  title: string;
}

const sampleData: TreeNode<TestNode> = {
  id: 'node-1',
  data: { title: 'Parent Node' },
  children: [
    {
      id: 'node-2',
      data: { title: 'Child Node' },
      children: [],
    },
  ],
};

describe('export utilities', () => {
  it('exportToJson exports valid JSON formatted string', () => {
    const jsonStr = exportToJson(sampleData, { indent: 2 });
    const parsed = JSON.parse(jsonStr);
    expect(parsed.id).toBe('node-1');
    expect(parsed.children[0].id).toBe('node-2');
  });

  it('importFromJson parses and validates tree payload', () => {
    const jsonStr = exportToJson(sampleData, { indent: 2 });
    const imported = importFromJson<TestNode>(jsonStr);
    expect(Array.isArray(imported)).toBe(false);
    expect((imported as TreeNode<TestNode>).id).toBe('node-1');
    expect((imported as TreeNode<TestNode>).children?.[0].id).toBe('node-2');
  });

  it('importFromJson handles array of roots (forest)', () => {
    const forest: TreeNode<TestNode>[] = [
      { id: 'f1', data: { title: 'Forest 1' }, children: [] },
      { id: 'f2', data: { title: 'Forest 2' }, children: [] },
    ];
    const jsonStr = exportToJson(forest);
    const imported = importFromJson<TestNode>(jsonStr);
    expect(Array.isArray(imported)).toBe(true);
    expect((imported as TreeNode<TestNode>[]).length).toBe(2);
  });

  it('importFromJson throws helpful error for invalid JSON or structure', () => {
    expect(() => importFromJson('invalid json string')).toThrow();
    expect(() => importFromJson('{"foo": "bar"}')).toThrow(/missing string "id" property/);
  });
});
