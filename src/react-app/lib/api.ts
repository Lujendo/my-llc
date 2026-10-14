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

  // Holdings
  listHoldings: () => api.request<{ constellations: any[] }>("/api/holdings"),
  createHolding: (data: any) => api.request<{ holding: any }>("/api/holdings", { method: "POST", body: JSON.stringify(data) }),
  getHolding: (id: string) => api.request<{ holding: any }>(`/api/holdings/${id}`),
  updateHolding: (id: string, data: any) => api.request<{ holding: any }>(`/api/holdings/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteHolding: (id: string) => api.request(`/api/holdings/${id}`, { method: "DELETE" }),
  setHoldingParent: (id: string, data: any) => api.request<{ relationship: any }>(`/api/holdings/${id}/parent`, { method: "POST", body: JSON.stringify(data) }),
  addHoldingMember: (id: string, data: any) => api.request<{ member: any }>(`/api/holdings/${id}/members`, { method: "POST", body: JSON.stringify(data) }),
  removeHoldingMember: (id: string, entityId: string) => api.request(`/api/holdings/${id}/members/${entityId}`, { method: "DELETE" }),
  getHoldingConsolidated: (id: string, asOf?: string) => {
    const qs = asOf ? `?asOf=${encodeURIComponent(asOf)}` : "";
    return api.request<any>(`/api/holdings/${id}/consolidated${qs}`);
  },

  // Calendar events
  listCalendarEvents: (params?: { start?: string; end?: string }) => {
    const qs = params ? `?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined && v !== null) as any))}` : "";
    return api.request<{ events: any[] }>(`/api/calendar-events${qs}`);
  },
  createCalendarEvent: (data: any) => api.request<{ event: any }>("/api/calendar-events", { method: "POST", body: JSON.stringify(data) }),
  getCalendarEvent: (id: string) => api.request<{ event: any }>(`/api/calendar-events/${id}`),
  updateCalendarEvent: (id: string, data: any) => api.request<{ event: any }>(`/api/calendar-events/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteCalendarEvent: (id: string) => api.request(`/api/calendar-events/${id}`, { method: "DELETE" }),

  // Me
  deleteMe: () => api.request("/api/me", { method: "DELETE" }),
  exportMe: () => api.request<any>("/api/me/export"),
};
