import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// GramJS is written for Node.js, so the browser build needs Buffer & friends polyfilled.
export default defineConfig({
  base: './',
  // 'vm' is left out on purpose: its polyfill is built on eval(), which this app never needs.
  plugins: [react(), nodePolyfills({ exclude: ['vm'] })],
  server: { port: 5173 },
});
