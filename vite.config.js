import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // Remove the rewrite function to keep the /api path
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src' // Mengatur @/ untuk merujuk ke folder src
    }
  }
});