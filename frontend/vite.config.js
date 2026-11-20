import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Al arrancar con "npm run dev" se abre la app en Chrome (no en el navegador de VS Code).
// Para no abrir nada: OPEN_BROWSER=false
process.env.BROWSER ??= 'chrome';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: process.env.OPEN_BROWSER !== 'false' ? '/' : false,
    proxy: {
      '/api': process.env.API_URL || 'http://localhost:3001',
    },
  },
});
