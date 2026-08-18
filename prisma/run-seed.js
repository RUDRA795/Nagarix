// Simple seed runner that bypasses ts-node quoting issues on Windows
require('ts-node').register({ compilerOptions: { module: 'commonjs' } });
require('./seed.ts');
