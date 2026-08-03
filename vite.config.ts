import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Firebase is most of the bundle and changes only when the SDK is
        // upgraded, so it is worth its own chunk: editing the app no longer
        // invalidates it in the browser cache.
        manualChunks: {
          firebase: ['firebase/app', 'firebase/firestore'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
});
