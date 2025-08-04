module.exports = {
  extends: ['@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    // Enforce Allman brace style (opening brace on new line)
    'brace-style': ['error', 'allman', { allowSingleLine: false }],
    
    // Enforce consistent spacing inside braces
    'object-curly-spacing': ['error', 'always'],
    
    // Enforce 2-space indentation
    indent: [
      'error',
      2,
      {
        SwitchCase: 1,
        VariableDeclarator: 1,
        MemberExpression: 1,
        FunctionDeclaration: { parameters: 1, body: 1 },
        FunctionExpression: { parameters: 1, body: 1 },
        CallExpression: { arguments: 1 },
        ArrayExpression: 1,
        ObjectExpression: 1,
        ImportDeclaration: 1,
        flatTernaryExpressions: false,
        ignoreComments: false
      }
    ],
    
    // Enforce semicolons
    semi: ['error', 'always'],
    
    // Enforce single quotes
    quotes: ['error', 'single'],
    
    // Enforce trailing commas
    'comma-dangle': ['error', 'never'],
    
    // No console statements in production
    'no-console': 'off', // Allow for this service package
    
    // Prefer const
    'prefer-const': 'error',
    
    // No unused variables
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    
    // Require explicit return types
    '@typescript-eslint/explicit-function-return-type': 'error'
  }
};
