const baseUrl = process.env.VITE_API_URL || 'https://my-llc-staging.info-eac.workers.dev';
const url = `${baseUrl}/api/health`;
try {
  const res = await fetch(url);
  const data = await res.json();
  console.assert(data.success === true, 'API health check failed');
  console.log('Smoke check passed');
  process.exit(0);
} catch (e) {
  console.error('Smoke check failed:', e);
  process.exit(1);
}
