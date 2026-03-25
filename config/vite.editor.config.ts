import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, '../src/editor/index.ts'),
      name: 'CIVideoHotspotEditor',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'video-hotspot-editor.esm.js';
        if (format === 'cjs') return 'video-hotspot-editor.cjs.js';
        return 'video-hotspot-editor.min.js';
      },
    },
    outDir: resolve(__dirname, '../dist/editor'),
    emptyOutDir: true,
    sourcemap: true,
    minify: 'esbuild',
    cssCodeSplit: false,
    rollupOptions: {
      output: { exports: 'named' },
    },
  },
});
