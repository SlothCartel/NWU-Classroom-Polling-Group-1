module.exports = {
  root: true,
  env: { node: true, es2022: true, browser: true },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  rules: { "@typescript-eslint/no-unused-vars": ["warn"] }
};
