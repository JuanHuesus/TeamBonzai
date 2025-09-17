import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  // 1) Yleiset ignoret
  globalIgnores([
    'dist',
    'node_modules',
    // ignoraa konfigit jos et halua lintata niitä
    'tailwind.config.*',
    'postcss.config.*',
    'vite.config.*',
    // jos sinulla on muutakin konfigia:
    '*.config.js',
    '*.config.cjs',
    '*.config.mjs',
  ]),

  // 2) TypeScript/TSX -säännöt (laajennukset)
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',        // 🔑
      globals: globals.browser,
    },
    rules: {
      // halutessasi omia sääntöjä
    },
  },

  // 3) JS/JSX (mm. konfigit) – kerrotaan että nämä ovat ESM-moduuleja
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',        // 🔑 ratkaisee "import/export" -virheen
      globals: globals.node,       // konfigeissa usein node-ympäristö
    },
  },
])
