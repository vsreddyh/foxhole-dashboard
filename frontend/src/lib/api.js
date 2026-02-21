const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export const getToken = () => localStorage.getItem('foxhole_token');
export const setToken = (t) => localStorage.setItem('foxhole_token', t);
export const clearToken = () => localStorage.removeItem('foxhole_token');

async function req(path, opts = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...opts.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API}${path}`, { ...opts, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data;
}

export const api = {
    auth: {
        login: (u, p) => req('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: u, password: p }) }),
        me: () => req('/api/auth/me'),
        logout: () => req('/api/auth/logout', { method: 'POST' }),
    },
    users: {
        list: () => req('/api/users'),
        create: (d) => req('/api/users', { method: 'POST', body: JSON.stringify(d) }),
        updateRole: (id, role) => req(`/api/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
        remove: (id) => req(`/api/users/${id}`, { method: 'DELETE' }),
    },
    bases: {
        list: () => req('/api/bases'),
        get: (id) => req(`/api/bases/${id}`),
        create: (d) => req('/api/bases', { method: 'POST', body: JSON.stringify(d) }),
        update: (id, d) => req(`/api/bases/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
        remove: (id) => req(`/api/bases/${id}`, { method: 'DELETE' }),
        alerts: (id) => req(`/api/bases/${id}/alerts`),
    },
    missions: {
        list: () => req('/api/missions'),
        get: (id) => req(`/api/missions/${id}`),
        create: (d) => req('/api/missions', { method: 'POST', body: JSON.stringify(d) }),
        update: (id, d) => req(`/api/missions/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
        remove: (id) => req(`/api/missions/${id}`, { method: 'DELETE' }),
    },
};
