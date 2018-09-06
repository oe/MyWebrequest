module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
    node: true
  },
  extends: 'standard',
  // define global variables
  globals: {
    chrome: true,
    webkitNotifications: true
  },
  plugins: ['html'],
  rules: {
    "space-before-function-paren": ["error", "always"],
    // allow paren-less arrow functions
    'arrow-parens': 0,
    'no-control-regex': 'off',
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0
  }
}
