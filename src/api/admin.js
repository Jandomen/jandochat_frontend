import api from './axios';

export const loginAdmin = async (credentials) => {
    // Relative path to avoid 'undefined' issues, uses JandoChat's axios config
    const res = await api.post('/api/admin/login', credentials);
    if (res.data.token) {
        localStorage.setItem('adminToken', res.data.token);
        localStorage.setItem('adminData', JSON.stringify(res.data.admin));
    }
    return res.data;
};

export const getAdminMetrics = async () => {
    const token = localStorage.getItem('adminToken');
    const res = await api.get('/api/admin/metrics', {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const searchById = async (id) => {
    const token = localStorage.getItem('adminToken');
    const res = await api.get(`/api/admin/search?q=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const suspendUser = async (id, data) => {
    const token = localStorage.getItem('adminToken');
    const res = await api.post(`/api/admin/user/${id}/suspend`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const deleteUser = async (id) => {
    const token = localStorage.getItem('adminToken');
    const res = await api.delete(`/api/admin/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const getReports = async () => {
    const token = localStorage.getItem('adminToken');
    const res = await api.get('/api/admin/reports', {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const handleReport = async (id, status) => {
    const token = localStorage.getItem('adminToken');
    const res = await api.put(`/api/admin/report/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

// Ads & Announcements
export const getAdminAds = async () => {
    const token = localStorage.getItem('adminToken');
    const res = await api.get('/api/admin/ads', {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const createAdminAd = async (data) => {
    const token = localStorage.getItem('adminToken');
    const res = await api.post('/api/admin/ads', data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const updateAdminAd = async (id, data) => {
    const token = localStorage.getItem('adminToken');
    const res = await api.patch(`/api/admin/ads/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const toggleAdminAdStatus = async (id, status) => {
    const token = localStorage.getItem('adminToken');
    const res = await api.put(`/api/admin/ads/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const deleteAdminAd = async (id) => {
    const token = localStorage.getItem('adminToken');
    const res = await api.delete(`/api/admin/ads/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const deletePostAdmin = async (id) => {
    const token = localStorage.getItem('adminToken');
    const res = await api.delete(`/api/admin/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const logoutAdmin = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
};
