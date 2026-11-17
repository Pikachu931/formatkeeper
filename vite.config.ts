import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Prebundle the render pipeline at startup; otherwise Vite discovers these
  // on the first paste and the preview stalls while they are optimized.
  optimizeDeps: {
    include: [
      'react-markdown',
      'remark-gfm',
      'remark-math',
      'rehype-katex',
      'rehype-highlight',
      'katex',
      'lucide-react',
    ],
  },
  build: {
    rollupOptions: {
      output: {
        // Split the heavy render pipeline so pastes without math or code never
        // pay for KaTeX and highlight.js, and each vendor chunk stays cached.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('/katex/')) return 'katex'
          if (
            id.includes('highlight.js') ||
            id.includes('lowlight') ||
            id.includes('rehype-highlight')
          ) {
            return 'highlight'
          }
          if (
            id.includes('react-markdown') ||
            id.includes('remark-') ||
            id.includes('rehype-') ||
            id.includes('micromark') ||
            id.includes('mdast') ||
            id.includes('hast') ||
            id.includes('unified') ||
            id.includes('unist')
          ) {
            return 'markdown'
          }
          return undefined
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
