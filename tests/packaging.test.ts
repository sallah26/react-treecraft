//
//  Packaging guards
//
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { escapeCssValue, nodeSelector } from '../src/utils/dom';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

describe('packaging', () => {
  it('never imports CSS from JS (a require("x.css") in the CJS build breaks SSR / Jest)', () => {
    const offenders = sourceFiles(join(__dirname, '../src')).filter((file) =>
      /^\s*import\s+(?:[^'"]+from\s+)?['"][^'"]+\.css['"]/m.test(readFileSync(file, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });
});

describe('escapeCssValue fallback (no CSS.escape in Node)', () => {
  it('escapes quotes and backslashes', () => {
    expect(escapeCssValue('a"b\\c')).toBe('a\\"b\\\\c');
    expect(nodeSelector('x"y')).toBe('[data-tc-node-id="x\\"y"]');
  });
});
