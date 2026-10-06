import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // supabase/functions/** er Deno Edge Functions (server-side, egne konventioner —
  // fx tilladt @ts-nocheck og any i hurtig JSON-parsing), ikke frontend-koden
  // denne config er skrevet til. Samme udelukkelse som tsconfig.app.json bruger.
  globalIgnores(['dist', 'dist-preview', 'supabase/functions/**']),
  {
    // Dækker al appens kode (appen er næsten udelukkende .js/.jsx).
    files: ['**/*.{js,jsx,ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Alle .jsx-filer har bevidst // @ts-nocheck (CLAUDE.md §2).
      '@typescript-eslint/ban-ts-comment': 'off',
      // Ubrugte variabler og tomme catch-blokke er oprydning, ikke fejl:
      // vises som advarsler, så de ikke skjuler de rigtige fejl.
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Nye React-regler, der kræver større omskrivninger af eksisterende
      // kode: advarsler indtil de er gennemgået. rules-of-hooks forbliver en fejl.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/static-components': 'warn',
      'react-refresh/only-export-components': 'warn',
    },
  },
  {
    // Tests og scripts kører i Node (global, process).
    files: ['**/*.test.{js,jsx}', 'scripts/**', 'vite.config.ts'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    // Service workers.
    files: ['public/sw.js', 'src/sw.js'],
    languageOptions: { globals: { ...globals.serviceworker } },
  },
])
