import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3006,
    // In dev: proxy /api calls to the Express server running on 3007
    proxy: {
      '/api': {
        target: 'http://localhost:3007',
        changeOrigin: true,
      },
    },
  },

  // preview is only used for local testing of the production build
  // In production, Express serves the files — not Vite preview
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT) || 4173,
    allowedHosts: true,
  },
});
