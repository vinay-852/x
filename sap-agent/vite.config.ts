import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ Build isolated bundle for WordPress
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // or wherever your plugin PHP expects assets/
    emptyOutDir: true,
    target: 'es2017',
    sourcemap: false,
    rollupOptions: {
      input: '/index.html',
      output: {
        format: 'iife', // isolated bundle (not ESM)
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[extname]',
      },
    },
  },
})
