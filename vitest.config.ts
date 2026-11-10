import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.tsx'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/integration/*.test.{mjs,js,ts}'],
    globals: true,
    fileParallelism: true,
    poolOptions: {
      forks: {
        minForks: 1,
        maxForks: 1,
        // Un seul worker évite la surcharge mémoire de plusieurs processus
        // concurrents. Le tas est relevé à 4 Go pour absorber l'accumulation
        // d'état de module d'un worker qui exécute les fichiers à la suite.
        execArgv: ['--max-old-space-size=4096'],
      },
    },
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});