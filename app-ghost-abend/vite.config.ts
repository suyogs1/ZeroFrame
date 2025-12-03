import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@skeleton-core': path.resolve(__dirname, '../skeleton-core/src')
    }
  },
  server: {
    port: 4173
  }
});
