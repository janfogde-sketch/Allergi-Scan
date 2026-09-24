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
  },
})
