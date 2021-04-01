module.exports = {
  root: true,
  extends: "@react-native-community",
  rules: {
    "object-curly-spacing": ["error", "always"],
    quotes: ["error", "double", { avoidEscape: true }],
    "react/jsx-uses-react": "off",
    "react/react-in-jsx-scope": "off",
  },
};
