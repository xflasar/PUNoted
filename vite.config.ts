/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    allowedHosts: ['punoted.net']
  },
  resolve: {
    dedupe: ["react", "react-dom"]
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
  build: {
    minify: 'esbuild',
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
})
