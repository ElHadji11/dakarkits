import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
  // One worker: the journey writes to the shared database.
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL,
    // A phone on a slow connection is the real customer.
    ...devices['Pixel 7'],
    trace: 'retain-on-failure',
  },
  // Reuses a dev server if one is already up; starts one otherwise.
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
