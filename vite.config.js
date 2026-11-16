import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import { localShellPlugin } from './scripts/local-shell-plugin.js'

export default defineConfig({
  plugins: [react(), localShellPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
