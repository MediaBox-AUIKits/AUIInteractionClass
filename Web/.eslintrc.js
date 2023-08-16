// .eslintrc.js
module.exports = {
  // Umi 项目
  extends: require.resolve('umi/eslint'),
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    'no-useless-catch': 'warn',
    '@typescript-eslint/no-unused-expressions': 'off',
  },
};
