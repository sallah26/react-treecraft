// ─────────────────────────────────────────────────────────────
//  DefaultCollapseBtn — built-in chevron toggle
// ─────────────────────────────────────────────────────────────
import React from 'react';

interface Props {
  isCollapsed: boolean;
  onClick: (e: React.MouseEvent) => void;
  orientation?: 'vertical' | 'horizontal';
}

export function DefaultCollapseBtn({ isCollapsed, onClick, orientation = 'vertical' }: Props) {
  const expandedClass = orientation === 'horizontal'
    ? isCollapsed ? '' : 'tc-collapse-btn--expanded-h'
    : isCollapsed ? '' : 'tc-collapse-btn--expanded';

  return (
    <button
      className={`tc-collapse-btn ${expandedClass}`}
      onClick={onClick}
      aria-label={isCollapsed ? 'Expand' : 'Collapse'}
      title={isCollapsed ? 'Expand' : 'Collapse'}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}
