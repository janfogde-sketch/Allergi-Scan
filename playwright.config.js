import { defineConfig } from '@playwright/test'

// Klik-tests (røgtests) af appens hovedveje. Kører mod det byggede site (vite preview) med en forfalsket backend,
// så der aldrig oprettes konti, sendes mails/push eller ringes til Supabase. Kør: npm run build && npm run test:e2e
// Lokalt/cloud: sæt PW_CHROMIUM_PATH til en forhåndsinstalleret Chromium; i CI hentes den med `npx playwright install chromium`.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    serviceWorkers: 'block',
    locale: 'da-DK',
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
})
