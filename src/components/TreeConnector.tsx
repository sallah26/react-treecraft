// ─────────────────────────────────────────────────────────────
//  TreeConnector — SVG Connector Line Renderer
//  Supports Orthogonal (sharp & rounded), Curved (Bézier),
//  Straight diagonal lines, customizable stroke patterns,
//  colors, thickness, and animated flow pulses.
// ─────────────────────────────────────────────────────────────
import React, { useState, useLayoutEffect, useCallback, useRef } from 'react';
import type { InternalNode, ConnectorType, ConnectorPattern } from '../types';

interface TreeConnectorProps<T> {
  orientation: 'vertical' | 'horizontal';
  childrenRowRef: React.RefObject<HTMLDivElement>;
  childrenNodes: InternalNode<T>[];
  highlightPathIds?: Set<string>;
  connectorType?: ConnectorType;
  connectorPattern?: ConnectorPattern;
  lineRadius?: number;
  lineColor?: string;
  lineWidth?: number;
  highlightColor?: string;
}

export function TreeConnector<T>({
  orientation,
  childrenRowRef,
  childrenNodes,
  highlightPathIds,
  connectorType = 'orthogonal',
  connectorPattern = 'solid',
  lineRadius = 8,
  lineColor,
  lineWidth,
  highlightColor,
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

  // Active indices for ancestor path tracing
  const activeIndices = childrenNodes
    .map((child, idx) => (highlightPathIds?.has(child.id) ? idx : -1))
    .filter((idx) => idx !== -1);

  let basePath = '';
  let highlightedPaths: string[] = [];

  // ── 1. Vertical Orientation Paths ─────────────────────────────
  if (orientation === 'vertical') {
    const midY = height / 2;

    if (connectorType === 'curved') {
      // Cubic Bézier S-curves
      basePath = childCoords
        .map((x) => `M ${parentCoord} 0 C ${parentCoord} ${midY}, ${x} ${midY}, ${x} ${height}`)
        .join(' ');

      highlightedPaths = activeIndices
        .map((idx) => {
          const x = childCoords[idx];
          return x !== undefined
            ? `M ${parentCoord} 0 C ${parentCoord} ${midY}, ${x} ${midY}, ${x} ${height}`
            : '';
        })
        .filter(Boolean);
    } else if (connectorType === 'straight') {
      // Direct diagonal lines
      basePath = childCoords
        .map((x) => `M ${parentCoord} 0 L ${x} ${height}`)
        .join(' ');

      highlightedPaths = activeIndices
        .map((idx) => {
          const x = childCoords[idx];
          return x !== undefined ? `M ${parentCoord} 0 L ${x} ${height}` : '';
        })
        .filter(Boolean);
    } else {
      // Orthogonal (Step) with adjustable corner roundness
      if (childCoords.length === 1) {
        basePath = `M ${parentCoord} 0 L ${childCoords[0]} ${height}`;
        highlightedPaths = activeIndices.map(() => `M ${parentCoord} 0 L ${childCoords[0]} ${height}`);
      } else if (lineRadius <= 0) {
        // Sharp 90-degree corners
        const minX = childCoords[0];
        const maxX = childCoords[childCoords.length - 1];
        const stemsDown = childCoords.map((x) => `M ${x} ${midY} L ${x} ${height}`).join(' ');
        basePath = `M ${parentCoord} 0 L ${parentCoord} ${midY} M ${minX} ${midY} L ${maxX} ${midY} ${stemsDown}`;

        highlightedPaths = activeIndices
          .map((idx) => {
            const x = childCoords[idx];
            return x !== undefined
              ? `M ${parentCoord} 0 L ${parentCoord} ${midY} L ${x} ${midY} L ${x} ${height}`
              : '';
          })
          .filter(Boolean);
      } else {
        // Rounded corners via SVG quadratic arcs (Q)
        const branchPaths = childCoords.map((x) => {
          if (Math.abs(x - parentCoord) < 2) {
            return `M ${parentCoord} 0 L ${parentCoord} ${height}`;
          }
          const isLeft = x < parentCoord;
          const r1 = Math.min(lineRadius, Math.abs(parentCoord - x) / 2, midY / 2);
          const r2 = Math.min(lineRadius, Math.abs(parentCoord - x) / 2, (height - midY) / 2);

          if (isLeft) {
            return `M ${parentCoord} 0 L ${parentCoord} ${midY - r1} Q ${parentCoord} ${midY} ${parentCoord - r1} ${midY} L ${x + r2} ${midY} Q ${x} ${midY} ${x} ${midY + r2} L ${x} ${height}`;
          }
          return `M ${parentCoord} 0 L ${parentCoord} ${midY - r1} Q ${parentCoord} ${midY} ${parentCoord + r1} ${midY} L ${x - r2} ${midY} Q ${x} ${midY} ${x} ${midY + r2} L ${x} ${height}`;
        });

        basePath = branchPaths.join(' ');
        highlightedPaths = activeIndices
          .map((idx) => branchPaths[idx] || '')
          .filter(Boolean);
      }
    }
  }

  // ── 2. Horizontal Orientation Paths ───────────────────────────
  if (orientation === 'horizontal') {
    const midX = width / 2;

    if (connectorType === 'curved') {
      // Horizontal Cubic Bézier S-curves
      basePath = childCoords
        .map((y) => `M 0 ${parentCoord} C ${midX} ${parentCoord}, ${midX} ${y}, ${width} ${y}`)
        .join(' ');

      highlightedPaths = activeIndices
        .map((idx) => {
          const y = childCoords[idx];
          return y !== undefined
            ? `M 0 ${parentCoord} C ${midX} ${parentCoord}, ${midX} ${y}, ${width} ${y}`
            : '';
        })
        .filter(Boolean);
    } else if (connectorType === 'straight') {
      // Direct diagonal lines
      basePath = childCoords
        .map((y) => `M 0 ${parentCoord} L ${width} ${y}`)
        .join(' ');

      highlightedPaths = activeIndices
        .map((idx) => {
          const y = childCoords[idx];
          return y !== undefined ? `M 0 ${parentCoord} L ${width} ${y}` : '';
        })
        .filter(Boolean);
    } else {
      // Orthogonal (Step)
      if (childCoords.length === 1) {
        basePath = `M 0 ${parentCoord} L ${width} ${childCoords[0]}`;
        highlightedPaths = activeIndices.map(() => `M 0 ${parentCoord} L ${width} ${childCoords[0]}`);
      } else if (lineRadius <= 0) {
        // Sharp 90-degree corners
        const minY = childCoords[0];
        const maxY = childCoords[childCoords.length - 1];
        const stemsRight = childCoords.map((y) => `M ${midX} ${y} L ${width} ${y}`).join(' ');
        basePath = `M 0 ${parentCoord} L ${midX} ${parentCoord} M ${midX} ${minY} L ${midX} ${maxY} ${stemsRight}`;

        highlightedPaths = activeIndices
          .map((idx) => {
            const y = childCoords[idx];
            return y !== undefined
              ? `M 0 ${parentCoord} L ${midX} ${parentCoord} L ${midX} ${y} L ${width} ${y}`
              : '';
          })
          .filter(Boolean);
      } else {
        // Rounded corners via SVG quadratic arcs (Q)
        const branchPaths = childCoords.map((y) => {
          if (Math.abs(y - parentCoord) < 2) {
            return `M 0 ${parentCoord} L ${width} ${parentCoord}`;
          }
          const isUp = y < parentCoord;
          const r1 = Math.min(lineRadius, midX / 2, Math.abs(parentCoord - y) / 2);
          const r2 = Math.min(lineRadius, (width - midX) / 2, Math.abs(parentCoord - y) / 2);

          if (isUp) {
            return `M 0 ${parentCoord} L ${midX - r1} ${parentCoord} Q ${midX} ${parentCoord} ${midX} ${parentCoord - r1} L ${midX} ${y + r2} Q ${midX} ${y} ${midX + r2} ${y} L ${width} ${y}`;
          }
          return `M 0 ${parentCoord} L ${midX - r1} ${parentCoord} Q ${midX} ${parentCoord} ${midX} ${parentCoord + r1} L ${midX} ${y - r2} Q ${midX} ${y} ${midX + r2} ${y} L ${width} ${y}`;
        });

        basePath = branchPaths.join(' ');
        highlightedPaths = activeIndices
          .map((idx) => branchPaths[idx] || '')
          .filter(Boolean);
      }
    }
  }

  const baseStyle: React.CSSProperties = {
    ...(lineColor ? { stroke: lineColor } : {}),
    ...(lineWidth !== undefined ? { strokeWidth: lineWidth } : {}),
  };

  const highlightStyle: React.CSSProperties = {
    ...(highlightColor ? { stroke: highlightColor } : {}),
    ...(lineWidth !== undefined ? { strokeWidth: lineWidth + 0.5 } : {}),
  };

  return (
    <div
      ref={containerRef}
      className={`tc-connector-zone tc-connector-zone--${orientation}`}
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
        {/* Base structural line paths */}
        <path
          d={basePath}
          className={`tc-line tc-line--base tc-line--${connectorPattern}`}
          style={baseStyle}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Active highlighted ancestor path lines */}
        {highlightedPaths.map((d, i) => (
          <path
            key={i}
            d={d}
            className={`tc-line tc-line--highlighted tc-line--${connectorPattern}`}
            style={highlightStyle}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </div>
  );
}
