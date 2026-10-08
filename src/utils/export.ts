// ─────────────────────────────────────────────────────────────
//  react-treecraft — Canvas & Data Export Utilities
// ─────────────────────────────────────────────────────────────

import type {
  TreeNode,
  SvgExportOptions,
  PngExportOptions,
  JsonExportOptions,
} from '../types';

/**
 * Trigger a browser download for a file using a Blob, data URL, or text string.
 */
export function downloadFile(
  content: Blob | string,
  filename: string,
  mimeType = 'application/octet-stream',
): void {
  if (typeof window === 'undefined') return;

  let url: string;
  let isCreatedUrl = false;

  if (typeof content === 'string') {
    if (content.startsWith('data:')) {
      // Data URL (e.g. data:image/png;base64,...) can be directly set on anchor.href
      url = content;
    } else {
      const blob = new Blob([content], { type: mimeType });
      url = URL.createObjectURL(blob);
      isCreatedUrl = true;
    }
  } else {
    url = URL.createObjectURL(content);
    isCreatedUrl = true;
  }

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();

  // Clean up object URL if created
  setTimeout(() => {
    document.body.removeChild(anchor);
    if (isCreatedUrl) {
      URL.revokeObjectURL(url);
    }
  }, 300);
}

/**
 * Extract CSS rules from document stylesheets to inline in exported SVGs.
 * @param safeForCanvas When true, strips @import and external url() font references to prevent canvas tainting.
 */
function collectDocumentStyles(safeForCanvas = false): string {
  if (typeof document === 'undefined') return '';

  const cssChunks: string[] = [];

  // Extract root CSS variables
  try {
    const rootComputed = window.getComputedStyle(document.documentElement);
    const tcVars: string[] = [];
    for (let i = 0; i < rootComputed.length; i++) {
      const prop = rootComputed[i];
      if (prop.startsWith('--tc-')) {
        tcVars.push(`${prop}: ${rootComputed.getPropertyValue(prop)};`);
      }
    }
    if (tcVars.length > 0) {
      cssChunks.push(`:root { ${tcVars.join(' ')} }`);
    }
  } catch {
    // Ignore computed style errors
  }

  // Extract rules from stylesheets
  const styleSheets = Array.from(document.styleSheets);
  for (const sheet of styleSheets) {
    try {
      if (sheet.cssRules) {
        const rules = Array.from(sheet.cssRules);
        for (const rule of rules) {
          let text = rule.cssText;
          if (safeForCanvas) {
            // Strip @import and external url() to avoid canvas tainting / CORS blocking in rasterization
            if (rule.type === CSSRule.IMPORT_RULE) continue;
            text = text.replace(/url\(['"]?https?:\/\/[^)'"]+['"]?\)/gi, 'none');
          }
          cssChunks.push(text);
        }
      }
    } catch {
      // Cross-origin stylesheets may throw security errors on cssRules access — safely ignore
    }
  }

  return cssChunks.join('\n');
}

/**
 * Calculate the true unscaled bounds of the entire tree hierarchy.
 */
export function getTreeDimensions(
  element: HTMLElement,
  padding = 32,
): {
  contentWidth: number;
  contentHeight: number;
  totalWidth: number;
  totalHeight: number;
  target: HTMLElement;
} {
  // Prefer innermost tree wrapper
  const treeWrapper = element.querySelector('.tc-tree-wrapper, .tc-forest') as HTMLElement | null;
  const canvasEl = element.querySelector('.tc-canvas') as HTMLElement | null;
  const target = treeWrapper ?? canvasEl ?? element;

  // Find all node elements to compute true bounding rectangle
  const allNodes = Array.from(target.querySelectorAll('.tc-node-card, .tc-branch'));

  let maxW = target.scrollWidth || 0;
  let maxH = target.scrollHeight || 0;

  if (allNodes.length > 0) {
    const rootRect = target.getBoundingClientRect();
    // In case target or parent is currently scaled with CSS transform, get the scale factor
    let scaleFactor = 1;
    if (canvasEl && canvasEl.style.transform) {
      const match = canvasEl.style.transform.match(/scale\(([^)]+)\)/);
      if (match) scaleFactor = parseFloat(match[1]) || 1;
    }

    allNodes.forEach((node) => {
      const nr = (node as HTMLElement).getBoundingClientRect();
      const right = (nr.right - rootRect.left) / scaleFactor;
      const bottom = (nr.bottom - rootRect.top) / scaleFactor;
      if (right > maxW) maxW = right;
      if (bottom > maxH) maxH = bottom;
    });
  }

  const contentWidth = Math.ceil(Math.max(maxW, target.offsetWidth || 0, 400));
  const contentHeight = Math.ceil(Math.max(maxH, target.offsetHeight || 0, 300));
  const totalWidth = Math.ceil(contentWidth + padding * 2);
  const totalHeight = Math.ceil(contentHeight + padding * 2);

  return { contentWidth, contentHeight, totalWidth, totalHeight, target };
}

/**
 * Export a TreeCraft DOM element as a standalone SVG string.
 */
export async function exportToSvg(
  element: HTMLElement,
  options: SvgExportOptions = {},
): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('[react-treecraft] SVG export requires a browser environment.');
  }

  const {
    backgroundColor = 'transparent',
    padding = 32,
    title = 'Tree Diagram',
    customCss = '',
    safeForCanvas = false,
  } = options;

  const { contentWidth, contentHeight, totalWidth, totalHeight, target } = getTreeDimensions(element, padding);

  // Clone the target node so we don't modify the active live DOM
  const clone = target.cloneNode(true) as HTMLElement;

  // Clear live transform / positioning on the clone for clean natural 1:1 scale
  clone.style.transform = 'none';
  clone.style.margin = '0';
  clone.style.position = 'static';
  clone.style.left = 'auto';
  clone.style.top = 'auto';
  clone.style.width = `${contentWidth}px`;
  clone.style.height = `${contentHeight}px`;

  // Strip transient animation styles (which start with opacity: 0 due to animationFillMode: both)
  clone.querySelectorAll<HTMLElement>('*').forEach((el) => {
    el.style.removeProperty('animation');
    el.style.removeProperty('animation-delay');
    el.style.removeProperty('animation-fill-mode');
    el.style.removeProperty('animation-name');
    el.style.removeProperty('animation-duration');
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.filter = 'none';
    el.style.visibility = 'visible';
    el.classList.remove('tc-node-card--dragging');
    el.classList.remove('tc-node-card--drop-inside');
  });

  // Extract container-level CSS variables (like custom nodeGap, levelGap, line colors, etc.)
  const containerTcVars: string[] = [];
  try {
    const computed = window.getComputedStyle(element);
    const tcProps = [
      '--tc-line-color',
      '--tc-line-width',
      '--tc-line-radius',
      '--tc-node-gap',
      '--tc-level-gap',
      '--tc-focus-color',
      '--tc-focus-glow',
      '--tc-selected-color',
    ];
    for (const prop of tcProps) {
      const val = computed.getPropertyValue(prop);
      if (val) containerTcVars.push(`${prop}: ${val};`);
    }
  } catch {
    // Ignore computed style errors
  }

  // Inline styling
  const docStyles = collectDocumentStyles(safeForCanvas);
  const allStyles = `
    ${docStyles}
    :root, .tc-tree-wrapper, .tc-forest, .tc-canvas {
      ${containerTcVars.join(' ')}
    }
    ${customCss}
    *, *::before, *::after {
      box-sizing: border-box;
      animation: none !important;
      transition: none !important;
    }
    [class*="tc-anim-"] {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
      visibility: visible !important;
    }
    .tc-tree-wrapper, .tc-forest {
      display: inline-flex !important;
      min-width: max-content !important;
      min-height: max-content !important;
      width: 100% !important;
      height: 100% !important;
      transform: none !important;
      position: static !important;
      overflow: visible !important;
    }
    .tc-branch {
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
      visibility: visible !important;
    }
    .tc-canvas {
      display: inline-flex !important;
      width: auto !important;
      height: auto !important;
      transform: none !important;
      overflow: visible !important;
    }
    .tc-children-row--vertical, .tc-children-row--horizontal {
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
  `;

  // Serialize cloned HTML into XML
  const serializer = new XMLSerializer();
  const serializedHtml = serializer.serializeToString(clone);

  // Assemble full SVG document
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <title>${title}</title>
  <defs>
    <style type="text/css">
      <![CDATA[
      ${allStyles}
      ]]>
    </style>
  </defs>
  ${backgroundColor && backgroundColor !== 'transparent' ? `<rect width="100%" height="100%" fill="${backgroundColor}" />` : ''}
  <g transform="translate(${padding}, ${padding})">
    <foreignObject width="${contentWidth}" height="${contentHeight}" requiredExtensions="http://www.w3.org/1999/xhtml">
      <div xmlns="http://www.w3.org/1999/xhtml" style="display:inline-flex; width:${contentWidth}px; height:${contentHeight}px; min-width:max-content; min-height:max-content;">
        ${serializedHtml}
      </div>
    </foreignObject>
  </g>
</svg>`.trim();

  return svg;
}

/**
 * Export a TreeCraft DOM element as a high-resolution PNG data URL.
 */
export async function exportToPng(
  element: HTMLElement,
  options: PngExportOptions = {},
): Promise<string> {
  const {
    scale = 2,
    quality = 1,
    backgroundColor = 'transparent',
    padding = 32,
  } = options;

  const { totalWidth, totalHeight } = getTreeDimensions(element, padding);

  // Generate SVG with canvas-safe styles (no cross-origin font/image tainting)
  const svgString = await exportToSvg(element, {
    ...options,
    safeForCanvas: true,
  });

  return new Promise((resolve, reject) => {
    // Convert SVG string to base64 Data URI for reliable cross-browser image loading
    let dataUri: string;
    try {
      const utf8Bytes = new TextEncoder().encode(svgString);
      let binary = '';
      for (let i = 0; i < utf8Bytes.length; i++) {
        binary += String.fromCharCode(utf8Bytes[i]);
      }
      dataUri = `data:image/svg+xml;base64,${btoa(binary)}`;
    } catch {
      dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(totalWidth * scale);
        canvas.height = Math.round(totalHeight * scale);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Unable to create canvas 2D rendering context.'));
          return;
        }

        // Apply background if specified
        if (backgroundColor && backgroundColor !== 'transparent') {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image stretched to full canvas pixel dimensions (guaranteeing 100% whole tree rendering)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const pngUrl = canvas.toDataURL('image/png', quality);
        resolve(pngUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(new Error(`Failed to load SVG into canvas for PNG rasterization: ${err}`));
    };

    img.src = dataUri;
  });
}

/**
 * Download a TreeCraft DOM element as a standalone SVG file.
 */
export async function downloadSvg(
  element: HTMLElement,
  filename = 'tree-diagram.svg',
  options: SvgExportOptions = {},
): Promise<void> {
  const svgString = await exportToSvg(element, options);
  downloadFile(svgString, filename, 'image/svg+xml;charset=utf-8');
}

/**
 * Download a TreeCraft DOM element as a high-resolution PNG file.
 */
export async function downloadPng(
  element: HTMLElement,
  filename = 'tree-diagram.png',
  options: PngExportOptions = {},
): Promise<void> {
  const pngDataUrl = await exportToPng(element, options);
  downloadFile(pngDataUrl, filename, 'image/png');
}

/**
 * Export tree data as a formatted JSON string.
 */
export function exportToJson<T = Record<string, unknown>>(
  data: TreeNode<T> | TreeNode<T>[],
  options: JsonExportOptions = {},
): string {
  const { indent = 2 } = options;
  return JSON.stringify(data, null, indent);
}

/**
 * Download tree data as a JSON file.
 */
export function downloadJson<T = Record<string, unknown>>(
  data: TreeNode<T> | TreeNode<T>[],
  filename = 'tree-data.json',
  options: JsonExportOptions = {},
): void {
  const jsonString = exportToJson(data, options);
  downloadFile(jsonString, filename, 'application/json;charset=utf-8');
}

/**
 * Parse and validate a JSON string into a TreeNode structure.
 */
export function importFromJson<T = Record<string, unknown>>(
  jsonString: string,
): TreeNode<T> | TreeNode<T>[] {
  const parsed = JSON.parse(jsonString);

  // Validate basic shape
  const items = Array.isArray(parsed) ? parsed : [parsed];
  for (const item of items) {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string') {
      throw new Error('[react-treecraft] Invalid tree node: missing string "id" property.');
    }
  }

  return parsed as TreeNode<T> | TreeNode<T>[];
}

/**
 * Read and parse a JSON File from an <input type="file"> event.
 */
export function readJsonFile<T = Record<string, unknown>>(
  file: File,
): Promise<TreeNode<T> | TreeNode<T>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = importFromJson<T>(text);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}
