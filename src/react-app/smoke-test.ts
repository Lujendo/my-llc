import { smokeCheck } from './lib/smoke-check';

smokeCheck().then((ok) => {
  if (!ok) {
    process.exit(1);
  }
  console.log('Smoke check passed');
  process.exit(0);
});
