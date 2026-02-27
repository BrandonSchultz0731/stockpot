module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['./jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/server/'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-community|@react-navigation|react-native-reanimated|react-native-screens|react-native-safe-area-context|react-native-svg|react-native-css-interop|nativewind|lucide-react-native|clsx|react-native-vision-camera|react-native-blob-util|react-native-image-picker|react-native-image-crop-picker|react-native-bootsplash)/)',
  ],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/__mocks__/styleMock.js',
  },
};
