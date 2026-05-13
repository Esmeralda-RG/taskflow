import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: globals.node,
      sourceType: 'module',
      ecmaVersion: 2022,
    },
    rules: {
      'no-unused-vars': ['warn'],
      'no-console': ['warn'],
    },
  },
];
