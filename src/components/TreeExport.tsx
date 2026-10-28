// 
//  react-treecraft — TreeExport Companion Component
// 
import React, { useState, useRef, useEffect } from 'react';
import type {
  TreeExportProps,
  ExportFormat,
  TreeCraftRef,
  TreeNode,
} from '../types';
import {
  downloadPng,
  downloadSvg,
  downloadJson,
  readJsonFile,
} from '../utils/export';

export function TreeExport<T = Record<string, unknown>>({
  treeRef,
  data,
  filename = 'tree-diagram',
  className = '',
  style,
  backgroundColor = 'transparent',
  scale = 2,
  allowImport = true,
  onImport,
  onExport,
}: TreeExportProps<T>) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeFormat, setActiveFormat] = useState<ExportFormat | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTargetElement = (): HTMLElement | null => {
    if (!treeRef) return null;
    if ('current' in treeRef && treeRef.current) {
      const refVal = treeRef.current;
      if ('canvas' in refVal && refVal.canvas) return refVal.canvas;
      if ('container' in refVal && refVal.container) return refVal.container;
      if (refVal instanceof HTMLElement) return refVal;
    } else if ('canvas' in (treeRef as TreeCraftRef) && (treeRef as TreeCraftRef).canvas) {
      return (treeRef as TreeCraftRef).canvas;
    } else if ('container' in (treeRef as TreeCraftRef) && (treeRef as TreeCraftRef).container) {
      return (treeRef as TreeCraftRef).container;
    }
    return null;
  };

  const handleExport = async (format: ExportFormat) => {
    try {
      setIsExporting(true);
      setActiveFormat(format);
      setOpen(false);

      if (format === 'json') {
        if (data) {
          downloadJson(data, `${filename}.json`);
          onExport?.('json');
        } else if (treeRef && 'current' in treeRef && treeRef.current && 'downloadJson' in treeRef.current) {
          (treeRef.current as TreeCraftRef).downloadJson(`${filename}.json`);
          onExport?.('json');
        }
        return;
      }

      const targetEl = getTargetElement();
      if (!targetEl) {
        console.warn('[react-treecraft] TreeExport: Target tree element not found for image export.');
        return;
      }

      if (format === 'png') {
        await downloadPng(targetEl, `${filename}.png`, {
          backgroundColor,
          scale,
        });
        onExport?.('png');
      } else if (format === 'svg') {
        await downloadSvg(targetEl, `${filename}.svg`, {
          backgroundColor,
        });
        onExport?.('svg');
      }
    } catch (err) {
      console.error('[react-treecraft] Export failed:', err);
    } finally {
      setIsExporting(false);
      setActiveFormat(null);
    }
  };

  const handleImportClick = () => {
    setOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedData = await readJsonFile<T>(file);
      onImport?.(importedData);
    } catch (err) {
      console.error('[react-treecraft] Import JSON failed:', err);
      alert('Failed to parse JSON file. Please ensure it is a valid TreeCraft JSON export.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div
      ref={dropdownRef}
      className={`tc-export ${className}`}
      style={style}
    >
      <button
        type="button"
        className={`tc-export-trigger ${open ? 'tc-export-trigger--open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        disabled={isExporting}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <svg
          className="tc-export-icon"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>{isExporting ? `Exporting ${activeFormat?.toUpperCase()}...` : 'Export / Import'}</span>
        <svg
          className={`tc-export-chevron ${open ? 'tc-export-chevron--open' : ''}`}
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="tc-export-menu" role="menu">
          <button
            type="button"
            className="tc-export-item"
            role="menuitem"
            onClick={() => handleExport('png')}
          >
            <span className="tc-export-item-icon">📸</span>
            <div className="tc-export-item-text">
              <span className="tc-export-item-title">Export PNG</span>
              <span className="tc-export-item-subtitle">High resolution raster image</span>
            </div>
          </button>

          <button
            type="button"
            className="tc-export-item"
            role="menuitem"
            onClick={() => handleExport('svg')}
          >
            <span className="tc-export-item-icon">🖼️</span>
            <div className="tc-export-item-text">
              <span className="tc-export-item-title">Export SVG</span>
              <span className="tc-export-item-subtitle">Scalable vector diagram</span>
            </div>
          </button>

          <button
            type="button"
            className="tc-export-item"
            role="menuitem"
            onClick={() => handleExport('json')}
          >
            <span className="tc-export-item-icon">📄</span>
            <div className="tc-export-item-text">
              <span className="tc-export-item-title">Export JSON</span>
              <span className="tc-export-item-subtitle">Tree hierarchy data file</span>
            </div>
          </button>

          {allowImport && (
            <>
              <div className="tc-export-divider" style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
              <button
                type="button"
                className="tc-export-item"
                role="menuitem"
                onClick={handleImportClick}
              >
                <span className="tc-export-item-icon">📥</span>
                <div className="tc-export-item-text">
                  <span className="tc-export-item-title">Import JSON</span>
                  <span className="tc-export-item-subtitle">Load from JSON file</span>
                </div>
              </button>
            </>
          )}
        </div>
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}
