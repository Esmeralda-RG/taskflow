import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  {
    files: ['**/*.{js,jsx}'],

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',

      globals: {
        ...globals.browser,
      },
    },
  },

  js.configs.recommended,

  {
    ...react.configs.flat.recommended,

    files: ['**/*.{js,jsx}'],

    settings: {
      react: {
        version: 'detect',
      },
    },

    rules: {
      ...react.configs.flat.recommended.rules,

      'react/react-in-jsx-scope': 'off',

      'react/prop-types': 'off',
    },
  },

  {
    files: ['**/*.{js,jsx}'],

    plugins: {
      'react-hooks': reactHooks,
    },

    rules: {
      ...reactHooks.configs.recommended.rules,

      'react-hooks/set-state-in-effect': 'off',
    },
  },
];