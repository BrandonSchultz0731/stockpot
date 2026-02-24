module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['documents/', 'server/'],
  rules: {
    'react/no-unstable-nested-components': ['warn', { allowAsProps: true }],
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
  },
};
