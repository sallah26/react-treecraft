import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  splitting: false,
  treeshake: true,
  external: ['react', 'react-dom'],
  injectStyle: false,
  // CSS is intentionally not imported from JS (a require('./x.css') in the CJS build breaks
  // SSR and Jest). The stylesheet ships as a single file: import 'react-treecraft/styles'.
  onSuccess: 'cp src/styles/index.css dist/index.css && echo ✅ react-treecraft built successfully!',
});
