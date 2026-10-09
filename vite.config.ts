import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// `vite build --mode artifact` produces a single-bundle build (no lazy chunks,
// in-memory router) that scripts/build-artifact.mjs inlines into one HTML file
// for hosting in a sandboxed viewer.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, host: true },
  define: { __EMBEDDED__: JSON.stringify(mode === 'artifact') },
  build:
    mode === 'artifact'
      ? { outDir: 'dist-artifact', emptyOutDir: true, chunkSizeWarningLimit: 2000, rollupOptions: { output: { inlineDynamicImports: true } } }
      : undefined,
}));
