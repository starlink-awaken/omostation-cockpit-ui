import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
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
      // 测试统一走 vitest (bun:test 与 vitest 混用导致 test:unit Transform 失败, 2026-09-12)
      'no-restricted-imports': [
        'error',
        { paths: [{ name: 'bun:test', message: 'Use vitest instead (bun:test breaks bun run test:unit).' }] },
      ],
    },
  },
])
