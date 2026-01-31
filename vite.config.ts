
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Import process as default from node:process to access cwd()
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Use process.cwd() as node:process does not have a named export 'cwd'
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    base: './',
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || "")
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true
    }
  };
});
