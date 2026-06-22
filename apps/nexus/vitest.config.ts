import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    // Testes de RLS sobem schema + seed e compartilham um Postgres; serial evita corrida.
    fileParallelism: false,
    hookTimeout: 30000,
    testTimeout: 30000,
  },
});
