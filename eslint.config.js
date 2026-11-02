// Lint do aplicativo: regras oficiais do Expo (React Native, hooks e TypeScript).
const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');

module.exports = defineConfig([
  ...expo,
  {
    ignores: ['node_modules/**', '.expo/**', 'dist/**', 'web-build/**'],
  },
]);
