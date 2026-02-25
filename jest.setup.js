/* global jest */
// Mock react-native-vision-camera (native module not available in Jest)
jest.mock('react-native-vision-camera', () => ({
  Camera: 'Camera',
  useCameraDevice: jest.fn(() => null),
  useCameraPermission: jest.fn(() => ({
    hasPermission: false,
    requestPermission: jest.fn(),
  })),
  useCodeScanner: jest.fn(() => null),
}));

// Silence console.warn from NativeWind / React Navigation in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('NativeWind') || args[0].includes('Require cycle'))
  ) {
    return;
  }
  originalWarn(...args);
};
