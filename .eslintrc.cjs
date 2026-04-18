module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    webextensions: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:security/recommended-legacy',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'react-hooks', 'security'],
  rules: {
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'security/detect-object-injection': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  ignorePatterns: ['dist', 'node_modules', '*.config.*'],
};
