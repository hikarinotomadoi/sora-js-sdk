module.exports = {
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true
  },
  "extends": ["eslint:recommended", "plugin:prettier/recommended"],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaFeatures": {
      "experimentalObjectRestSpread": true,
      "jsx": true
    },
    "sourceType": "module"
  },
  "plugins": [
    "@typescript-eslint"
  ],
  "globals": {
    "process": true
  },
  "rules": {
    "indent": [
      "error",
      2,
      { "SwitchCase": 1 }
    ],
    "keyword-spacing": [
      "error",
      { "before": true, "after": true, "overrides": {} }
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "no-console": "off",
    "no-unused-vars": "off",
    "no-var": "error",
    "quotes": [
      "error",
      "single"
    ],
    "max-len": "off",
    "object-curly-spacing": [
      "error",
      "always"
    ],
    "semi": [
      "error",
      "always"
    ],
    "space-in-parens": ["error", "never"],
    "space-unary-ops": "error"
  }
};
