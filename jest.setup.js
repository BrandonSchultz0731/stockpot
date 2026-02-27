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

// Mock react-native-blob-util (native module not available in Jest)
jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fs: {
      readFile: jest.fn(() => Promise.resolve('')),
    },
  },
}));

// Mock react-native-bootsplash (native module not available in Jest)
jest.mock('react-native-bootsplash', () => ({
  hide: jest.fn(() => Promise.resolve()),
  isVisible: jest.fn(() => Promise.resolve(false)),
  useHideAnimation: jest.fn(() => ({ container: {}, logo: {} })),
}));

// Mock react-native-image-picker (native module not available in Jest)
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

// Mock react-native-bootsplash (native module not available in Jest)
jest.mock('react-native-bootsplash', () => ({
  hide: jest.fn(() => Promise.resolve()),
  isVisible: jest.fn(() => Promise.resolve(false)),
  useHideAnimation: jest.fn(() => ({ container: {}, logo: {} })),
}));

// Mock react-native-image-crop-picker (native module not available in Jest)
jest.mock('react-native-image-crop-picker', () => ({
  openCropper: jest.fn(() => Promise.resolve({ data: '', mime: 'image/jpeg' })),
  openPicker: jest.fn(() => Promise.resolve({ path: '', mime: 'image/jpeg' })),
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
