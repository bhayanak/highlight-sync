import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      include: [
        'src/background/storage.ts',
        'src/background/export-engine.ts',
        'src/background/sync-manager.ts',
        'src/lib/sm2.ts',
        'src/lib/dexie-db.ts',
        'src/lib/html-to-md.ts',
        'src/shared/utils.ts',
        'src/shared/constants.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
      },
    },
  },
});
