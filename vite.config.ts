import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// GramJS is written for Node.js, so the browser build needs Buffer & friends polyfilled.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    nodePolyfills({
      // 'vm': its polyfill is built on eval(), which this app never needs.
      // 'crypto': replaced below by GramJS's own browser crypto (Web Crypto API).
      exclude: ['vm', 'crypto'],
    }),
  ],
  resolve: {
    alias: {
      // The generic 'crypto' polyfill returns its own Buffer type, which GramJS refuses
      // to serialize ("Bytes or str expected, not Buffer") as soon as a 2FA password is hashed.
      crypto: fileURLToPath(new URL('./node_modules/telegram/crypto/crypto.js', import.meta.url)),
    },
  },
  server: { port: 5173 },
});
