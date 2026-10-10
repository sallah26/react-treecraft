import { describe, it, expect } from 'vitest';
import {
  toArray,
  annotate,
  findNode,
  getPath,
  collectDescendantIds,
  collectAllIds,
  addChildNode,
  removeNode,
  updateNodeData,
  moveNode,
  flattenTree,
  buildTree,
  generateId,
} from '../src/utils/tree-helpers';
import type { TreeNode } from '../src/types';

interface UserData {
  name: string;
  role: string;
}

const sampleTree: TreeNode<UserData> = {
  id: 'root',
  data: { name: 'Root Person', role: 'CEO' },
  children: [
    {
      id: 'eng',
      data: { name: 'Eng Lead', role: 'CTO' },
      children: [
        { id: 'fe1', data: { name: 'Dev 1', role: 'Frontend' }, children: [] },
        { id: 'be1', data: { name: 'Dev 2', role: 'Backend' }, children: [] },
      ],
    },
    {
      id: 'mkt',
      data: { name: 'Mkt Lead', role: 'CMO' },
      children: [],
    },
  ],
};

describe('tree-helpers', () => {
  it('generateId generates unique string ids with prefix', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).toMatch(/^tc_/);
    expect(id2).toMatch(/^tc_/);
    expect(id1).not.toBe(id2);
  });

  it('toArray converts single node or array correctly', () => {
    expect(toArray(sampleTree)).toEqual([sampleTree]);
    expect(toArray([sampleTree])).toEqual([sampleTree]);
  });

  it('annotate attaches depth, path, isRoot, and isLeaf accurately', () => {
    const annotated = annotate([sampleTree]);
    const root = annotated[0];
    expect(root._depth).toBe(0);
    expect(root._isRoot).toBe(true);
    expect(root._isLeaf).toBe(false);
    expect(root._path).toEqual(['root']);

    const eng = root.children[0];
    expect(eng._depth).toBe(1);
    expect(eng._isRoot).toBe(false);
    expect(eng._isLeaf).toBe(false);
    expect(eng._path).toEqual(['root', 'eng']);

    const fe1 = eng.children[0];
    expect(fe1._depth).toBe(2);
    expect(fe1._isLeaf).toBe(true);
    expect(fe1._path).toEqual(['root', 'eng', 'fe1']);
  });

  it('findNode locates existing node and returns null for missing node', () => {
    const found = findNode([sampleTree], 'fe1');
    expect(found).not.toBeNull();
    expect(found?.data.name).toBe('Dev 1');

    const missing = findNode([sampleTree], 'non-existent');
    expect(missing).toBeNull();
  });

  it('getPath returns root-to-target chain', () => {
    const path = getPath([sampleTree], 'be1');
    expect(path).not.toBeNull();
    expect(path?.map((n) => n.id)).toEqual(['root', 'eng', 'be1']);

    const invalidPath = getPath([sampleTree], 'invalid');
    expect(invalidPath).toBeNull();
  });

  it('collectDescendantIds and collectAllIds collect all node ids', () => {
    const engDescendants = collectDescendantIds(sampleTree.children![0]);
    expect(engDescendants).toEqual(['eng', 'fe1', 'be1']);

    const allIds = collectAllIds([sampleTree]);
    expect(allIds).toEqual(['root', 'eng', 'fe1', 'be1', 'mkt']);
  });

  it('addChildNode adds child immutably', () => {
    const newChild: TreeNode<UserData> = {
      id: 'mkt1',
      data: { name: 'Growth Hacker', role: 'Marketing' },
      children: [],
    };
    const updated = addChildNode([sampleTree], 'mkt', newChild);
    const mktNode = findNode(updated, 'mkt');
    expect(mktNode?.children?.length).toBe(1);
    expect(mktNode?.children?.[0].id).toBe('mkt1');
    // Verify original tree untouched
    expect(sampleTree.children![1].children?.length).toBe(0);
  });

  it('removeNode removes node and its subtree immutably', () => {
    const updated = removeNode([sampleTree], 'eng');
    expect(findNode(updated, 'eng')).toBeNull();
    expect(findNode(updated, 'fe1')).toBeNull();
    expect(findNode(updated, 'be1')).toBeNull();
    expect(findNode(updated, 'mkt')).not.toBeNull();
  });

  it('updateNodeData merges partial data immutably', () => {
    const updated = updateNodeData([sampleTree], 'fe1', { role: 'Lead Frontend' });
    const fe1 = findNode(updated, 'fe1');
    expect(fe1?.data.role).toBe('Lead Frontend');
    expect(fe1?.data.name).toBe('Dev 1');
  });

  it('moveNode reparents node inside another node', () => {
    const updated = moveNode([sampleTree], 'fe1', 'mkt', 'inside');
    const eng = findNode(updated, 'eng');
    const mkt = findNode(updated, 'mkt');
    expect(eng?.children?.map((c) => c.id)).toEqual(['be1']);
    expect(mkt?.children?.map((c) => c.id)).toEqual(['fe1']);
  });

  it('moveNode orders sibling before and after', () => {
    // move be1 before fe1
    const movedBefore = moveNode([sampleTree], 'be1', 'fe1', 'before');
    const engBefore = findNode(movedBefore, 'eng');
    expect(engBefore?.children?.map((c) => c.id)).toEqual(['be1', 'fe1']);

    // move fe1 after be1
    const movedAfter = moveNode(movedBefore, 'be1', 'fe1', 'after');
    const engAfter = findNode(movedAfter, 'eng');
    expect(engAfter?.children?.map((c) => c.id)).toEqual(['fe1', 'be1']);
  });

  it('moveNode prevents cyclical parenting into descendants', () => {
    const triedCyclic = moveNode([sampleTree], 'eng', 'fe1', 'inside');
    expect(triedCyclic).toEqual([sampleTree]);
  });

  it('flattenTree and buildTree convert tree bidirectionally', () => {
    const flat = flattenTree([sampleTree]);
    expect(flat.length).toBe(5);
    expect(flat.find((f) => f.id === 'root')?.parentId).toBeNull();
    expect(flat.find((f) => f.id === 'fe1')?.parentId).toBe('eng');

    const reconstructed = buildTree(flat.map((f) => ({ ...f.data, id: f.id, parentId: f.parentId })));
    expect(reconstructed.length).toBe(1);
    expect(reconstructed[0].id).toBe('root');
    expect(reconstructed[0].children?.length).toBe(2);
  });
});
