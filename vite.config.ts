import { defineConfig } from 'vite';

export default defineConfig({
  appType: 'spa',
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
