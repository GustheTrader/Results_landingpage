import devServer from '@hono/vite-dev-server'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    devServer({
      entry: 'src/index.tsx'
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: './src/index.tsx',
      output: {
        entryFileNames: 'index.js',
        format: 'es'
      }
    },
    ssr: true,
    outDir: 'dist'
  }
})
