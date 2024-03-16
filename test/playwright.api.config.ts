import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    // All requests we send go to this API endpoint.
    baseURL: 'http://localhost:8080/api/',
  },
  outputDir: '../test-results/playwright/',
  retries: process.env.CI ? 2 : 0,
  testMatch: 'test/*.api.spec.ts',
  workers: 2
})
