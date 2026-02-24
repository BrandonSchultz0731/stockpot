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
