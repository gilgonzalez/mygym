import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // apps/mobile es un proyecto Expo/React Native aparte, con su propio script
  // "lint" (expo lint) y sus propias convenciones (p. ej. require() para
  // assets ttf/png es el patrón estándar de Expo, no un error) — este config
  // está pensado para la web (Next.js) y no debería aplicarse ahí.
  { ignores: ['dist', '.next', 'next-env.d.ts', 'apps/mobile'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
)
