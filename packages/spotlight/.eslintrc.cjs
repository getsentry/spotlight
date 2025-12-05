module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'dist-electron', 'out', 'node_modules', '.turbo'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react-refresh'],
  overrides: [
    {
      files: ['**/*.cjs'],
      env: {
        node: true,
      },
      parserOptions: {
        sourceType: 'script',
      },
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
  rules: {
    // Only enable the react-refresh rule, let Biome handle everything else
    'react-refresh/only-export-components': [
      'warn',
      { 
        allowConstantExport: true,
        allowExportNames: ['use*'], // Allow hooks to be exported with components
      },
    ],
    // Disable other rules to avoid conflicts with Biome
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-var': 'off', // Disable no-var as it's not relevant to Fast Refresh
    'react-hooks/rules-of-hooks': 'off', // Disable this as it's creating false positives
  },
};

