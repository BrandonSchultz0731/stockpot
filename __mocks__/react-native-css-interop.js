const React = require('react');

module.exports = {
  cssInterop: (component) => component,
  remapProps: () => {},
  createInteropElement: React.createElement.bind(React),
};
