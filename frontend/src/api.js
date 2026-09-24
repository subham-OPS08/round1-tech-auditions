const API_BASE = '/api/v1';

export const authState = {
  getToken: () => sessionStorage.getItem('event_auth_token'),
  setToken: (token) => sessionStorage.setItem('event_auth_token', token),
  clearToken: () => sessionStorage.removeItem('event_auth_token'),
  getUser: () => {
    try {
      const u = sessionStorage.getItem('event_auth_user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  },
  setUser: (user) => sessionStorage.setItem('event_auth_user', JSON.stringify(user)),
  clearUser: () => sessionStorage.removeItem('event_auth_user'),
};

export async function apiRequest(endpoint, options = {}) {
  const token = authState.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : null;

    if (res.status === 401) {
      authState.clearToken();
      authState.clearUser();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    if (!res.ok) {
      const errorObj = data?.error || {
        code: 'NETWORK_ERROR',
        message: `HTTP ${res.status}: ${res.statusText}`,
      };
      const error = new Error(errorObj.message);
      error.code = errorObj.code;
      error.status = res.status;
      error.extra = errorObj;
      throw error;
    }

    return data;
  } catch (err) {
    if (!err.code) {
      err.code = 'CONNECTION_FAILED';
      err.message = 'Unable to connect to server. Check your network or server status.';
    }
    throw err;
  }
}

export const api = {
  login: (username, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  getMe: () => apiRequest('/auth/me'),
  getStats: () => apiRequest('/dashboard/stats'),
  getAttendance: () => apiRequest('/attendance'),
  searchAttendance: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.department) qs.set('department', params.department);
    if (params.status) qs.set('status', params.status);
    if (params.page) qs.set('page', params.page);
    if (params.limit) qs.set('limit', params.limit);
    return apiRequest(`/attendance/search?${qs.toString()}`);
  },
  searchStudents: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.department) qs.set('department', params.department);
    if (params.status) qs.set('status', params.status);
    return apiRequest(`/students/search?${qs.toString()}`);
  },
  checkIn: (student_id, request_id) =>
    apiRequest('/attendance', {
      method: 'POST',
      body: JSON.stringify({ student_id, request_id }),
    }),
};
