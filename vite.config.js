import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['styled-jsx/babel'],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  // Hide HMR update messages - cuma show warning & error
  
  // Atau kalau mau lebih spesifik, bisa pakai custom logger
  // customLogger: {
  //   info: (msg) => {
  //     // Skip semua HMR messages
  //     if (msg.includes('hmr update') || msg.includes('[vite]')) return;
  //     console.log(msg);
  //   },
  //   warn: console.warn,
  //   error: console.error,
  //   warnOnce: console.warn,
  //   errorOnce: console.error
  // }
});