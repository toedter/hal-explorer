/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular() as any],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    reporters: ['verbose'],
    coverage: {
      enabled: false,
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage/vitest',
      exclude: [
        '**/*.html',
        '**/*.css',
        'src/test-setup.ts',
        'src/test.ts',
        'src/polyfills.ts',
        'src/main.ts',
        'src/environments/**',
        '**/*.spec.ts',
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
      ],
    },
  },
});
