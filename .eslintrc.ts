import type { Linter } from 'eslint';
import { resolve } from 'path';

const config = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'unicorn'] as unknown as Linter.Config['plugins'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:unicorn/recommended',
  ],
  rules: {
    // ❌ for/while の使用を制限
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForStatement',
        message: 'for文の代わりに map/filter/reduce を使用してください',
      },
      {
        selector: 'WhileStatement',
        message: 'while文は禁止されています',
      },
      {
        selector: 'DoWhileStatement',
        message: 'do...while文は禁止されています',
      },
    ],
    // ✅ ファイル名は kebab-case
    'unicorn/filename-case': [
      'error',
      {
        case: 'kebabCase',
      },
    ],
    // ✅ 型の明示・未使用の変数制限
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': ['warn'],
  },
  overrides: [
    {
      files: ['*.ts'],
      parserOptions: {
        project: [resolve(__dirname, 'tsconfig.json')],
      },
    },
  ],
} as const;

export default config;
