import { defineConfig } from 'vite';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

const root = path.resolve(__dirname, 'web');

export default defineConfig({
  root,
  publicDir: path.resolve(__dirname, 'public'),
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  define: {
    'import.meta.env.VITE_WEB_BUILD': JSON.stringify('true'),
  },
  build: {
    outDir: path.resolve(__dirname, 'web-dist'),
    emptyOutDir: true,
  },
});
