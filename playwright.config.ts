import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          // A plain-HTTP origin other than localhost is not a secure context, like the app opened
          // over a LAN address. Lets a test reach the local server that way.
          args: ['--host-resolver-rules=MAP todo.test 127.0.0.1'],
        },
      },
    },
  ],
  // Test the static export, which is what gets deployed. Rebuilt on every run so it is never stale.
  webServer: {
    command: 'npm run build && node scripts/serve.js',
    url: `http://localhost:${PORT}`,
    env: { PORT: String(PORT) },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
