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
 * Trigger a browser download for a file using a Blob or string content.
 */
export function downloadFile(
  content: Blob | string,
  filename: string,
  mimeType = 'application/octet-stream',
): void {
  if (typeof window === 'undefined') return;

  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 200);
}

/**
 * Extract all CSS rules from document stylesheets to inline in exported SVGs.
 */
function collectDocumentStyles(): string {
  if (typeof document === 'undefined') return '';

  const cssChunks: string[] = [];

  // Extract root CSS variables
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

  // Extract rules from stylesheets
  const styleSheets = Array.from(document.styleSheets);
  for (const sheet of styleSheets) {
    try {
      if (sheet.cssRules) {
        const rules = Array.from(sheet.cssRules);
        for (const rule of rules) {
          cssChunks.push(rule.cssText);
        }
      }
    } catch {
      // Cross-origin stylesheet access might fail silently
    }
  }

  return cssChunks.join('\n');
}

/**
 * Find the core tree wrapper inside a TreeCraft container or canvas element.
 */
function findTreeElement(containerOrElement: HTMLElement): HTMLElement {
  const treeWrapper = containerOrElement.querySelector('.tc-tree-wrapper, .tc-forest, .tc-canvas') as HTMLElement | null;
  return treeWrapper ?? containerOrElement;
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
  } = options;

  const target = findTreeElement(element);

  // Clone the target node so we don't modify the active live DOM
  const clone = target.cloneNode(true) as HTMLElement;

  // Clear any live panning/zooming transform on the clone so it measures at natural 1:1 scale
  clone.style.transform = 'none';
  clone.style.margin = '0';
  clone.style.position = 'static';
  clone.style.left = 'auto';
  clone.style.top = 'auto';

  // Measure content natural dimensions
  const scrollW = target.scrollWidth || target.offsetWidth || 800;
  const scrollH = target.scrollHeight || target.offsetHeight || 600;

  const contentWidth = Math.max(scrollW, target.getBoundingClientRect().width);
  const contentHeight = Math.max(scrollH, target.getBoundingClientRect().height);

  const totalWidth = Math.ceil(contentWidth + padding * 2);
  const totalHeight = Math.ceil(contentHeight + padding * 2);

  // Inline styling
  const docStyles = collectDocumentStyles();
  const allStyles = `
    ${docStyles}
    ${customCss}
    * { box-sizing: border-box; }
    .tc-tree-wrapper, .tc-forest { display: inline-flex !important; }
  `;

  // Serialize cloned HTML into XML format
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
      <div xmlns="http://www.w3.org/1999/xhtml" style="display:inline-block; width:100%; height:100%;">
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
  } = options;

  const svgString = await exportToSvg(element, options);

  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(blobUrl);
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
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);

        URL.revokeObjectURL(blobUrl);

        const pngUrl = canvas.toDataURL('image/png', quality);
        resolve(pngUrl);
      } catch (err) {
        URL.revokeObjectURL(blobUrl);
        reject(err);
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error(`Failed to load SVG into canvas for PNG rasterization: ${err}`));
    };

    img.src = blobUrl;
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
  
  // Convert Data URL to Blob for clean binary download
  const res = await fetch(pngDataUrl);
  const blob = await res.blob();
  downloadFile(blob, filename, 'image/png');
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
