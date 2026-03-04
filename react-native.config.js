module.exports = {
  assets: ['./assets/fonts/'],
  dependencies: {
    'react-native-worklets': {
      root: require.resolve('react-native-worklets/package.json').replace(
        '/package.json',
        '',
      ),
    },
  },
};
