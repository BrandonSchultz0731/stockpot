const React = require('react');
const { Text } = require('react-native');

function createIcon(name) {
  const Icon = (props) =>
    React.createElement(Text, { testID: `icon-${name}`, ...props }, name);
  Icon.displayName = name;
  return Icon;
}

module.exports = new Proxy(
  {},
  {
    get(_target, prop) {
      if (typeof prop === 'string') {
        return createIcon(prop);
      }
    },
  },
);
