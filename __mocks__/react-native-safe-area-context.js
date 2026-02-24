const React = require('react');
const { View } = require('react-native');

const insets = { top: 0, bottom: 0, left: 0, right: 0 };
const frame = { x: 0, y: 0, width: 0, height: 0 };

const SafeAreaContext = React.createContext({
  insets,
  frame,
});

const SafeAreaView = React.forwardRef(({ children, ...props }, ref) =>
  React.createElement(View, { ...props, ref }, children),
);
SafeAreaView.displayName = 'SafeAreaView';

function SafeAreaProvider({ children }) {
  return React.createElement(
    SafeAreaContext.Provider,
    { value: { insets, frame } },
    children,
  );
}

function SafeAreaInsetsContext({ children }) {
  return React.createElement(
    SafeAreaContext.Provider,
    { value: { insets, frame } },
    children,
  );
}

module.exports = {
  SafeAreaContext,
  SafeAreaView,
  SafeAreaProvider,
  SafeAreaInsetsContext,
  SafeAreaFrameContext: SafeAreaContext,
  useSafeAreaInsets: () => insets,
  useSafeAreaFrame: () => frame,
  initialWindowMetrics: { insets, frame },
  SafeAreaConsumer: SafeAreaContext.Consumer,
};
