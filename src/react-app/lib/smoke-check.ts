export const smokeCheck = async () => {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const url = `${baseUrl}/api/health`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.assert(data.success === true, 'API health check failed');
    return true;
  } catch (e) {
    console.error('Smoke check failed:', e);
    return false;
  }
};
