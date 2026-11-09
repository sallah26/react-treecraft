//
//  useThemeVersion — re-render when the page theme likely changed
//
import { useEffect, useState } from 'react';

const THEME_ATTRIBUTES = ['class', 'style', 'data-theme', 'data-mode', 'data-color-scheme'];

/**
 * Returns a counter that increments whenever the document theme may have changed:
 * a class / style / data-theme attribute change on <html> or <body> (how next-themes,
 * shadcn and most Tailwind dark-mode setups toggle themes), or an OS color-scheme change.
 *
 * Use it as a memo dependency for values derived from getComputedStyle / CSS variables.
 */
export function useThemeVersion(): number {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const schedule: (cb: () => void) => number =
      typeof window.requestAnimationFrame === 'function'
        ? (cb) => window.requestAnimationFrame(cb)
        : (cb) => window.setTimeout(cb, 16);
    const cancel: (id: number) => void =
      typeof window.cancelAnimationFrame === 'function'
        ? (id) => window.cancelAnimationFrame(id)
        : (id) => window.clearTimeout(id);

    let frame = 0;
    const bump = () => {
      // Coalesce bursts of attribute changes into a single re-render
      if (frame) return;
      frame = schedule(() => {
        frame = 0;
        setVersion((v) => v + 1);
      });
    };

    let observer: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(bump);
      const options: MutationObserverInit = { attributes: true, attributeFilter: THEME_ATTRIBUTES };
      observer.observe(document.documentElement, options);
      if (document.body) observer.observe(document.body, options);
    }

    const media = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;
    media?.addEventListener?.('change', bump);

    return () => {
      if (frame) cancel(frame);
      observer?.disconnect();
      media?.removeEventListener?.('change', bump);
    };
  }, []);

  return version;
}
