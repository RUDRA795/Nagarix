require('ts-node').register({ compilerOptions: { module: 'commonjs' } });
require('tsconfig-paths/register');
require('./master_e2e_test.ts');
