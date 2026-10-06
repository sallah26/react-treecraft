// ─────────────────────────────────────────────────────────────
//  TreeConnector — SVG-based orthogonal connector renderer
//  Calculates exact pixel coordinates for seamless base lines &
//  pixel-perfect highlighted path routing.
// ─────────────────────────────────────────────────────────────
import React, { useState, useLayoutEffect, useCallback, useRef } from 'react';
import type { InternalNode } from '../types';

interface TreeConnectorProps<T> {
  orientation: 'vertical' | 'horizontal';
  childrenRowRef: React.RefObject<HTMLDivElement>;
  childrenNodes: InternalNode<T>[];
  highlightPathIds?: Set<string>;
}

export function TreeConnector<T>({
  orientation,
  childrenRowRef,
  childrenNodes,
  highlightPathIds,
}: TreeConnectorProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{
    parentCoord: number;
    childCoords: number[];
    width: number;
    height: number;
  }>({ parentCoord: 0, childCoords: [], width: 0, height: 0 });

  const measure = useCallback(() => {
    const row = childrenRowRef.current;
    const container = containerRef.current;
    if (!row || !container) return;

    const childElements = Array.from(row.children) as HTMLElement[];
    if (childElements.length === 0) return;

    const width = container.offsetWidth || row.offsetWidth;
    const height = container.offsetHeight || 32;

    if (orientation === 'vertical') {
      const parentCoord = row.offsetWidth / 2;
      const childCoords = childElements.map((el) => el.offsetLeft + el.offsetWidth / 2);
      setLayout({ parentCoord, childCoords, width, height });
    } else {
      const parentCoord = row.offsetHeight / 2;
      const childCoords = childElements.map((el) => el.offsetTop + el.offsetHeight / 2);
      setLayout({ parentCoord, childCoords, width, height });
    }
  }, [orientation, childrenRowRef]);

  useLayoutEffect(() => {
    measure();
    const row = childrenRowRef.current;
    const container = containerRef.current;
    if (!row || !container) return;

    const ro = new ResizeObserver(() => {
      measure();
    });

    ro.observe(row);
    ro.observe(container);
    Array.from(row.children).forEach((child) => ro.observe(child));

    return () => ro.disconnect();
  }, [measure, childrenNodes.length]);

  const { parentCoord, childCoords, width, height } = layout;

  if (childCoords.length === 0 || width === 0 || height === 0) {
    return (
      <div
        ref={containerRef}
        className={`tc-connector-zone tc-connector-zone--${orientation}`}
        aria-hidden="true"
      />
    );
  }

  // ── Vertical connector lines ──────────────────────────────────
  if (orientation === 'vertical') {
    const minX = childCoords[0];
    const maxX = childCoords[childCoords.length - 1];
    const midY = height / 2;

    // Single child: direct straight line from parent center to child center
    let basePath = '';
    if (childCoords.length === 1) {
      basePath = `M ${parentCoord} 0 L ${childCoords[0]} ${height}`;
    } else {
      // 1. Stem from parent down to midpoint
      // 2. Continuous horizontal crossbar across all children
      // 3. Stems down from crossbar into each child center
      const stemsDown = childCoords.map((x) => `M ${x} ${midY} L ${x} ${height}`).join(' ');
      basePath = `M ${parentCoord} 0 L ${parentCoord} ${midY} M ${minX} ${midY} L ${maxX} ${midY} ${stemsDown}`;
    }

    // Highlighted paths: only trace from parent -> midpoint -> specific target child
    const activeIndices = childrenNodes
      .map((child, idx) => (highlightPathIds?.has(child.id) ? idx : -1))
      .filter((idx) => idx !== -1);

    const highlightedPaths = activeIndices.map((idx) => {
      const targetX = childCoords[idx];
      if (targetX === undefined) return '';
      if (childCoords.length === 1) {
        return `M ${parentCoord} 0 L ${targetX} ${height}`;
      }
      return `M ${parentCoord} 0 L ${parentCoord} ${midY} L ${targetX} ${midY} L ${targetX} ${height}`;
    }).filter(Boolean);

    return (
      <div
        ref={containerRef}
        className="tc-connector-zone tc-connector-zone--vertical"
        aria-hidden="true"
      >
        <svg
          className="tc-connector-svg"
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            overflow: 'visible',
            pointerEvents: 'none',
          }}
        >
          {/* Base structural lines */}
          <path
            d={basePath}
            className="tc-line tc-line--base"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active highlighted path lines */}
          {highlightedPaths.map((d, i) => (
            <path
              key={i}
              d={d}
              className="tc-line tc-line--highlighted"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
      </div>
    );
  }

  // ── Horizontal connector lines ────────────────────────────────
  const minY = childCoords[0];
  const maxY = childCoords[childCoords.length - 1];
  const midX = width / 2;

  let basePath = '';
  if (childCoords.length === 1) {
    basePath = `M 0 ${parentCoord} L ${width} ${childCoords[0]}`;
  } else {
    const stemsRight = childCoords.map((y) => `M ${midX} ${y} L ${width} ${y}`).join(' ');
    basePath = `M 0 ${parentCoord} L ${midX} ${parentCoord} M ${midX} ${minY} L ${midX} ${maxY} ${stemsRight}`;
  }

  const activeIndices = childrenNodes
    .map((child, idx) => (highlightPathIds?.has(child.id) ? idx : -1))
    .filter((idx) => idx !== -1);

  const highlightedPaths = activeIndices.map((idx) => {
    const targetY = childCoords[idx];
    if (targetY === undefined) return '';
    if (childCoords.length === 1) {
      return `M 0 ${parentCoord} L ${width} ${targetY}`;
    }
    return `M 0 ${parentCoord} L ${midX} ${parentCoord} L ${midX} ${targetY} L ${width} ${targetY}`;
  }).filter(Boolean);

  return (
    <div
      ref={containerRef}
      className="tc-connector-zone tc-connector-zone--horizontal"
      aria-hidden="true"
    >
      <svg
        className="tc-connector-svg"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        {/* Base structural lines */}
        <path
          d={basePath}
          className="tc-line tc-line--base"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Active highlighted path lines */}
        {highlightedPaths.map((d, i) => (
          <path
            key={i}
            d={d}
            className="tc-line tc-line--highlighted"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </div>
  );
}
