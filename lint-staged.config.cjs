module.exports = {
  "apps/api/**/*.{ts,tsx,js,css,md,json}": [
    "prettier --write",
    "npm --prefix apps/api run -s lint:fix"
  ],
  "apps/web/**/*.{ts,tsx,js,css,md,json}": [
    "prettier --write",
    "npm --prefix apps/web run -s lint:fix"
  ]
};
