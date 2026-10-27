// 
//  TreeSearch — optional built-in search component
// 
import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { TreeNode } from '../types';
import { flattenTree } from '../utils/tree-helpers';

export interface TreeSearchProps<T = Record<string, unknown>> {
  /** Pass the same `data` you gave to <TreeCraft> */
  data: TreeNode<T> | TreeNode<T>[];
  /** Called with the nodeId when the user picks a result */
  onResult: (nodeId: string) => void;
  /** Map a node to searchable text — defaults to node.id */
  getLabel?: (node: TreeNode<T>) => string;
  /** Map a node to subtitle or secondary description in results */
  getSubtitle?: (node: TreeNode<T>) => string | undefined;
  /** Input placeholder */
  placeholder?: string;
  /** Root container className */
  className?: string;
  /** Input className */
  inputClassName?: string;
  /** Results list className */
  resultsClassName?: string;
  /** Inline style overrides */
  style?: React.CSSProperties;
  /** Custom background color override (defaults to var(--background)) */
  backgroundColor?: string;
  /** Custom border color override (defaults to var(--border)) */
  borderColor?: string;
  /** Custom primary accent color override (defaults to var(--primary)) */
  primaryColor?: string;
  /** Show search icon on left. @default true */
  showIcon?: boolean;
  /** Show clear button when input has text. @default true */
  clearable?: boolean;
  /** Clear search input query on selection. @default true */
  clearOnSelect?: boolean;
  /** Max results to display. @default 20 */
  maxResults?: number;
  /** Auto focus input. @default false */
  autoFocus?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

export function TreeSearch<T = Record<string, unknown>>({
  data,
  onResult,
  getLabel,
  getSubtitle,
  placeholder = 'Search nodes…',
  className = '',
  inputClassName = '',
  resultsClassName = '',
  style,
  backgroundColor,
  borderColor,
  primaryColor,
  showIcon = true,
  clearable = true,
  clearOnSelect = true,
  maxResults = 20,
  autoFocus = false,
  disabled = false,
}: TreeSearchProps<T>) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; label: string; subtitle?: string }>>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const dataArr = Array.isArray(data) ? data : [data];

  const search = useCallback(
    (q: string) => {
      if (!q.trim()) {
        setResults([]);
        setOpen(false);
        setActiveIndex(-1);
        return;
      }
      const flat = flattenTree(dataArr as TreeNode<T>[]);
      const lower = q.toLowerCase();
      const matches = flat
        .filter((n) => {
          const label = getLabel ? getLabel(n) : n.id;
          const sub = getSubtitle ? getSubtitle(n) : undefined;
          return (
            label.toLowerCase().includes(lower) ||
            (sub && sub.toLowerCase().includes(lower))
          );
        })
        .slice(0, maxResults)
        .map((n) => ({
          id: n.id,
          label: getLabel ? getLabel(n) : n.id,
          subtitle: getSubtitle ? getSubtitle(n) : undefined,
        }));

      setResults(matches);
      setOpen(matches.length > 0);
      setActiveIndex(matches.length > 0 ? 0 : -1);
    },
    [dataArr, getLabel, getSubtitle, maxResults],
  );

  useEffect(() => {
    search(query);
  }, [query, search]);

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
    if (clearOnSelect) {
      setQuery('');
      setResults([]);
    }
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        setOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = activeIndex >= 0 && activeIndex < results.length ? results[activeIndex] : results[0];
      if (target) {
        pick(target.id);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const dynamicStyles: React.CSSProperties = {
    ...(backgroundColor ? ({ '--tc-search-bg': backgroundColor } as any) : {}),
    ...(borderColor ? ({ '--tc-search-border': borderColor } as any) : {}),
    ...(primaryColor ? ({ '--tc-search-primary': primaryColor } as any) : {}),
  };

  return (
    <div
      ref={containerRef}
      className={`tc-search ${className}`}
      style={{
        position: 'relative',
        display: 'flex',
        width: '100%',
        ...style,
      }}
    >
      <div
        className={`tc-search__wrapper ${isFocused ? 'tc-search__wrapper--focused' : ''}`}
        style={dynamicStyles}
      >
        {showIcon && (
          <span className="tc-search__icon" aria-hidden="true">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
        )}

        <input
          ref={inputRef}
          type="text"
          className={`tc-search__input ${inputClassName}`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          onFocus={() => {
            setIsFocused(true);
            if (results.length > 0) setOpen(true);
          }}
          onBlur={() => setIsFocused(false)}
          aria-label="Search tree nodes"
          aria-autocomplete="list"
          aria-expanded={open}
          disabled={disabled}
          autoFocus={autoFocus}
        />

        {clearable && query && (
          <button
            type="button"
            className="tc-search__clear"
            onClick={() => {
              setQuery('');
              setResults([]);
              setOpen(false);
              inputRef.current?.focus();
            }}
            aria-label="Clear search query"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && (
        <ul className={`tc-search__results ${resultsClassName}`} role="listbox">
          {results.map((r, index) => {
            const isHighlighted = activeIndex === index;
            return (
              <li
                key={r.id}
                className={`tc-search__result-item ${isHighlighted ? 'tc-search__result-item--active' : ''}`}
                role="option"
                aria-selected={isHighlighted}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(r.id);
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <div className="tc-search__result-main">
                  <span className="tc-search__result-label">{r.label}</span>
                  {r.subtitle && <span className="tc-search__result-sub">{r.subtitle}</span>}
                </div>
                <span className="tc-search__result-action">Select →</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
