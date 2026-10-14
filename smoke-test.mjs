import { smokeCheck } from './src/react-app/lib/smoke-check.ts';
const ok = await smokeCheck();
if (!ok) process.exit(1);
console.log('Smoke check passed');
process.exit(0);
