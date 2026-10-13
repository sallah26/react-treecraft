import { describe, it, expect } from 'vitest';
import {
  normalizeColorString,
  parseColorToRgba,
  colorWithAlpha,
  isLightBackground,
} from '../src/utils/color-helpers';

describe('color-helpers', () => {
  describe('normalizeColorString', () => {
    it('normalizes space-separated HSL values from Tailwind / shadcn', () => {
      expect(normalizeColorString('221.2 83.2% 53.3%')).toBe('hsl(221.2 83.2% 53.3%)');
    });

    it('returns trimmed color strings', () => {
      expect(normalizeColorString('  #3b82f6  ')).toBe('#3b82f6');
      expect(normalizeColorString('rgb(59, 130, 246)')).toBe('rgb(59, 130, 246)');
    });

    it('returns null for empty strings or null', () => {
      expect(normalizeColorString('')).toBeNull();
      expect(normalizeColorString(null)).toBeNull();
      expect(normalizeColorString(undefined)).toBeNull();
    });
  });

  describe('parseColorToRgba & colorWithAlpha', () => {
    it('parses 6-character hex and creates correct rgba with alpha', () => {
      const res = parseColorToRgba('#3b82f6');
      expect(res.r).toBe(59);
      expect(res.g).toBe(130);
      expect(res.b).toBe(246);
      expect(res.a).toBe(1);

      expect(colorWithAlpha('#3b82f6', 0.25)).toBe('rgba(59, 130, 246, 0.25)');
    });

    it('parses 3-character hex correctly', () => {
      const res = parseColorToRgba('#fff');
      expect(res.r).toBe(255);
      expect(res.g).toBe(255);
      expect(res.b).toBe(255);
      expect(colorWithAlpha('#fff', 0.5)).toBe('rgba(255, 255, 255, 0.5)');
    });

    it('parses rgb() and rgba() correctly', () => {
      expect(colorWithAlpha('rgb(10, 20, 30)', 0.12)).toBe('rgba(10, 20, 30, 0.12)');
      expect(colorWithAlpha('rgba(10, 20, 30, 0.9)', 0.4)).toBe('rgba(10, 20, 30, 0.4)');
    });

    it('falls back gracefully on empty or invalid inputs', () => {
      expect(colorWithAlpha('', 0.5)).toBe('rgba(96, 165, 250, 0.5)');
    });
  });

  describe('isLightBackground', () => {
    it('identifies light backgrounds correctly', () => {
      expect(isLightBackground('#ffffff')).toBe(true);
      expect(isLightBackground('rgb(250, 250, 250)')).toBe(true);
      expect(isLightBackground('#f8fafc')).toBe(true);
    });

    it('identifies dark backgrounds correctly', () => {
      expect(isLightBackground('#000000')).toBe(false);
      expect(isLightBackground('rgba(15, 23, 42, 0.88)')).toBe(false);
      expect(isLightBackground('#0f172a')).toBe(false);
    });
  });
});
