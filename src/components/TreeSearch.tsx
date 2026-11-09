// 
//  TreeSearch — optional built-in search component
// 
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { TreeNode } from '../types';
import { flattenTree, toArray } from '../utils/tree-helpers';

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
  const [isOpen, setIsOpen] = useState(false);
  const [rawActiveIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Results are derived state. (Previously an effect stored them with setState and depended on
  // a `[data]` array rebuilt every render, which re-rendered forever for single-root data.)
  const results = useMemo<Array<{ id: string; label: string; subtitle?: string }>>(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return [];
    const flat = flattenTree(toArray(data));
    const matches: Array<{ id: string; label: string; subtitle?: string }> = [];
    for (const n of flat) {
      if (matches.length >= maxResults) break;
      const label = getLabel ? getLabel(n) : n.id;
      const subtitle = getSubtitle ? getSubtitle(n) : undefined;
      if (label.toLowerCase().includes(lower) || (subtitle && subtitle.toLowerCase().includes(lower))) {
        matches.push({ id: n.id, label, subtitle });
      }
    }
    return matches;
  }, [query, data, getLabel, getSubtitle, maxResults]);

  const open = isOpen && results.length > 0;
  // Keep the active row valid when the result list shrinks (e.g. data changed while typing)
  const activeIndex = results.length === 0 ? -1 : Math.min(Math.max(rawActiveIndex, 0), results.length - 1);

  const updateQuery = (q: string) => {
    setQuery(q);
    setIsOpen(q.trim().length > 0);
    setActiveIndex(0);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (id: string) => {
    onResult(id);
    if (clearOnSelect) setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(activeIndex < results.length - 1 ? activeIndex + 1 : 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(activeIndex > 0 ? activeIndex - 1 : results.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = results[activeIndex] ?? results[0];
      if (target) pick(target.id);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
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
          onChange={(e) => updateQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          onFocus={() => {
            setIsFocused(true);
            if (results.length > 0) setIsOpen(true);
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
              updateQuery('');
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
