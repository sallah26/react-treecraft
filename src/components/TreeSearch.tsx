// ─────────────────────────────────────────────────────────────
//  TreeSearch — optional built-in search component
// ─────────────────────────────────────────────────────────────
import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { TreeNode } from '../types';
import { findNode, flattenTree } from '../utils/tree-helpers';

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

export function TreeSearch<T>({
  data,
  onResult,
  getLabel,
  placeholder = 'Search nodes…',
  className = '',
}: TreeSearchProps<T>) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; label: string }>>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const dataArr = Array.isArray(data) ? data : [data];

  const search = useCallback(
    (q: string) => {
      if (!q.trim()) { setResults([]); setOpen(false); return; }
      const flat = flattenTree(dataArr as TreeNode<T>[]);
      const matches = flat
        .filter((n) => {
          const label = getLabel ? getLabel(n) : n.id;
          return label.toLowerCase().includes(q.toLowerCase());
        })
        .slice(0, 20)
        .map((n) => ({ id: n.id, label: getLabel ? getLabel(n) : n.id }));
      setResults(matches);
      setOpen(matches.length > 0);
    },
    [dataArr, getLabel],
  );

  useEffect(() => { search(query); }, [query, search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (id: string) => {
    onResult(id);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`tc-search ${className}`} style={{ position: 'relative', display: 'inline-block' }}>
      <input
        ref={inputRef}
        className="tc-search__input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        onFocus={() => results.length > 0 && setOpen(true)}
        aria-label="Search tree nodes"
        aria-autocomplete="list"
        aria-expanded={open}
      />
      {open && (
        <ul className="tc-search__results" role="listbox">
          {results.map((r) => (
            <li
              key={r.id}
              className="tc-search__result-item"
              role="option"
              onMouseDown={() => pick(r.id)}
            >
              {r.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
