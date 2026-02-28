import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // Ensure it binds to all interfaces for headless browsers
    port: 5173,
    strictPort: true, // Fail if port is in use so we don't silently jump to 5174
  }
});