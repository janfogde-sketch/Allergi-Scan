import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const rootDir = import.meta.dirname

// __BUILD_TIME__ indsættes automatisk ved hvert build (inkl. Vercel-deploys).
// VERCEL_GIT_COMMIT_SHA injiceres af Vercel som env-variabel under build.
export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __COMMIT_SHA__: JSON.stringify(
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
      process.env.CF_PAGES_COMMIT_SHA?.slice(0, 7) ||
      "local"
    ),
  },
  build: {
    // Multi-page build: index.html er den mobile PWA (uændret), admin.html
    // er det separate desktop-admin-panel (src/admin/) — egen bundle, egen
    // React-rod, rører ikke den mobile apps bundle-størrelse eller stabilitet.
    rollupOptions: {
      input: {
        main: resolve(rootDir, 'index.html'),
        admin: resolve(rootDir, 'admin.html'),
      },
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{js,jsx}"],
    // Edge-funktionerne importerer supabase-js via jsr:/esm.sh; handlertests (src/testing/edgeHarness.js) bruger en stub.
    alias: [
      { find: /^jsr:@supabase\/supabase-js@2$/, replacement: resolve(rootDir, 'src/testing/supabaseStub.js') },
      { find: /^https:\/\/deno\.land\/std@[\d.]+\/http\/server\.ts$/, replacement: resolve(rootDir, 'src/testing/denoServeStub.js') },
      { find: /^https:\/\/esm\.sh\/@supabase\/supabase-js@2$/, replacement: resolve(rootDir, 'src/testing/supabaseStub.js') },
    ],
  },
})
