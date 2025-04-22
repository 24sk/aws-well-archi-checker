import tsParser from '@typescript-eslint/parser';
import type { Linter } from 'eslint';
import { resolve } from 'path';

const config: Linter.FlatConfig[] = [
  {
    ignores: [
      'eslint.config.ts',
      'node_modules/',
      'dist/',
      'output/',
      '*.log',
      '*.tmp',
      '.vscode/',
      '.env',
      '.env.*',
      'coverage/',
    ],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: [resolve(__dirname, 'tsconfig.json')],
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      // eslint-plugin-unicornを使用するとエラーとなるため、一旦コメントアウト
      // unicorn: require('eslint-plugin-unicorn'),
    },
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
      // 'unicorn/filename-case': [
      //   'error',
      //   {
      //     case: 'kebabCase',
      //   },
      // ],
      // ✅ 型の明示・未使用の変数制限
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': ['warn'],
    },
  },
];

export default config;
