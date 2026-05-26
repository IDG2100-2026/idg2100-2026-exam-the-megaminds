import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Pin to IPv4 — avoids the ~2s localhost IPv6 (::1) connection-fallback delay on Windows.
    host: '127.0.0.1',
    proxy: {
      // Dev-only: forward /api calls to the backend so the browser sees same-origin (no CORS).
      // 127.0.0.1 (not localhost) so the proxy hop doesn't pay the same IPv6 fallback cost.
      // Production needs real CORS on the backend instead — see TOURNAMENT_PLAN.md.
      '/api': 'http://127.0.0.1:8476',
    },
  },
})
