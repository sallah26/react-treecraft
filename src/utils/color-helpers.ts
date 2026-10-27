// 
//  Color Helpers — Dynamic CSS variable and color parsing
// 

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Normalizes CSS color values (e.g. space-separated HSL strings from Tailwind/shadcn).
 */
export function normalizeColorString(color: string | null | undefined): string | null {
  if (!color) return null;
  const trimmed = color.trim();
  if (!trimmed) return null;

  // Space-separated or comma-separated numbers/percentages e.g. "221.2 83.2% 53.3%"
  if (/^[\d.]+(?:\s+|\s*,\s*)[\d.]+%?(?:\s+|\s*,\s*)[\d.]+%?$/.test(trimmed)) {
    return `hsl(${trimmed})`;
  }

  return trimmed;
}

/**
 * Parses any CSS color string into an RGBA object.
 * Uses an offscreen canvas context in browser environments to support all CSS color syntaxes (hex, rgb, hsl, oklch, etc.).
 * Falls back to regex-based parsing in SSR / test environments.
 */
export function parseColorToRgba(
  color: string | null | undefined,
  fallback: RGBA = { r: 96, g: 165, b: 250, a: 1 },
): RGBA {
  const normalized = normalizeColorString(color);
  if (!normalized) return fallback;

  // In browser environments with document & canvas support
  if (typeof document !== 'undefined') {
    try {
      const probeCanvas = document.createElement('canvas');
      probeCanvas.width = 1;
      probeCanvas.height = 1;
      const ctx = probeCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillStyle = normalized;
        const computed = ctx.fillStyle;

        if (computed.startsWith('#')) {
          let hex = computed.slice(1);
          if (hex.length === 3) {
            hex = hex.split('').map((c) => c + c).join('');
          }
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          return { r, g, b, a: 1 };
        }

        const rgbaMatch = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (rgbaMatch) {
          return {
            r: parseInt(rgbaMatch[1], 10),
            g: parseInt(rgbaMatch[2], 10),
            b: parseInt(rgbaMatch[3], 10),
            a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1,
          };
        }
      }
    } catch {
      // Fall through to regex parser
    }
  }

  // Regex fallback for Hex (#fff, #ffffff, #ffffff80)
  if (normalized.startsWith('#')) {
    let hex = normalized.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const r = parseInt(hex.slice(0, 2), 16) || 0;
    const g = parseInt(hex.slice(2, 4), 16) || 0;
    const b = parseInt(hex.slice(4, 6), 16) || 0;
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }

  // Regex fallback for rgb / rgba
  const rgbMatch = normalized.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10) || 0,
      g: parseInt(rgbMatch[2], 10) || 0,
      b: parseInt(rgbMatch[3], 10) || 0,
      a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1,
    };
  }

  return fallback;
}

/**
 * Returns an rgba() CSS color string with a specific alpha transparency.
 */
export function colorWithAlpha(
  color: string | null | undefined,
  alpha: number,
  fallback = 'rgba(96, 165, 250, 1)',
): string {
  const rgba = parseColorToRgba(color);
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${clampedAlpha})`;
}

/**
 * Calculates perceived relative luminance (0 to 1) to determine if a background is light.
 */
export function isLightBackground(color: string | null | undefined): boolean {
  if (!color) return false;
  const rgba = parseColorToRgba(color, { r: 15, g: 23, b: 42, a: 1 });
  const lum = (0.299 * rgba.r + 0.587 * rgba.g + 0.114 * rgba.b) / 255;
  return lum > 0.55;
}

/**
 * Reads computed CSS variables from a target element or documentElement.
 */
export function getComputedCssVar(el: HTMLElement | null, varNames: string[]): string | null {
  if (typeof window === 'undefined') return null;
  const target = el || document.documentElement;
  try {
    const style = window.getComputedStyle(target);
    for (const name of varNames) {
      const val = style.getPropertyValue(name).trim();
      if (val) return val;
    }
  } catch {
    // Ignore in non-DOM or restricted environments
  }
  return null;
}
