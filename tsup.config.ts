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
  loader: {
    '.css': 'copy',
  },
  onSuccess: 'cp src/styles/index.css dist/index.css && echo ✅ react-treecraft built successfully!',
});
