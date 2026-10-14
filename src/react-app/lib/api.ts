const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  // Fallback to same-origin for staging/production
  return '';
};

let token: string | null = null;

export const api = {
  setToken: (t: string | null) => {
    token = t;
    if (t) {
      localStorage.setItem('auth_token', t);
    } else {
      localStorage.removeItem('auth_token');
    }
  },

  getToken: () => {
    if (token) return token;
    const stored = localStorage.getItem('auth_token');
    if (stored) {
      token = stored;
      return token;
    }
    return null;
  },

  clearToken: () => {
    token = null;
    localStorage.removeItem('auth_token');
  },

  request: async <T = any>(path: string, options: RequestInit = {}): Promise<T> => {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}${path}`;
    const headers = new Headers(options.headers || {});
    
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }
    
    const authToken = api.getToken();
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (response.status === 401) {
      api.clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
      throw new Error('Unauthorized');
    }
    
    let data: any;
    try {
      data = await response.json();
    } catch {
      data = { success: false, error: 'Invalid response' };
    }
    
    if (!response.ok || data.success === false) {
      const error = data.error || data.message || `Request failed: ${response.status}`;
      throw new Error(error);
    }
    
    return data.data || data;
  },
};
