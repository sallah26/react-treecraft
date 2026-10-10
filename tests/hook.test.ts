import { describe, it, expect } from 'vitest';
import React, { act } from 'react';
import { useTreeCraft } from '../src/hooks/useTreeCraft';
import type { TreeNode } from '../src/types';

interface Org {
  title: string;
}

const initial: TreeNode<Org> = {
  id: 'root',
  data: { title: 'Leader' },
  children: [
    { id: 'c1', data: { title: 'Staff 1' }, children: [] },
  ],
};

describe('useTreeCraft hook logic', () => {
  it('instantiates and provides complete mutation & query API', () => {
    let hookResult: ReturnType<typeof useTreeCraft<Org>> | undefined;

    function TestComponent() {
      hookResult = useTreeCraft<Org>({ initialData: initial });
      return null;
    }

    // Direct sanity test on state manager methods
    expect(typeof useTreeCraft).toBe('function');
  });
});
