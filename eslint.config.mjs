import { defineConfig } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([...nextVitals, ...nextTs, { ignores: ['.next/**', 'node_modules/**'], rules: { '@typescript-eslint/no-explicit-any': 'off', 'react-hooks/set-state-in-effect': 'off', 'react-hooks/exhaustive-deps': 'off' } }]);
