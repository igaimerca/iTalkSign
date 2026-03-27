import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Set GITHUB_PAGES=true during build for GitHub Pages project deployment.
  // Also ensure DATASET/ images are copied into public/ before building.
  base: process.env.VITE_BASE_PATH ?? '/',
});
