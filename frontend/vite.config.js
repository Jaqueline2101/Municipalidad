import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: false, // Evita que se abra automáticamente en el navegador
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/documentos': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
