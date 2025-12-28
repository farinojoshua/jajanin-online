import api from './api';

// Admin APIs
export const adminApi = {
    getStats: () => api.get('/api/v1/admin/stats'),
    getUsers: (page = 1, limit = 10) =>
        api.get(`/api/v1/admin/users?page=${page}&limit=${limit}`),
    getWithdrawals: (status?: string, page = 1, limit = 10) => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        return api.get(`/api/v1/admin/withdrawals?${params.toString()}`);
    },
    approveWithdrawal: (id: string) =>
        api.put(`/api/v1/admin/withdrawals/${id}/approve`),
    rejectWithdrawal: (id: string, reason?: string) =>
        api.put(`/api/v1/admin/withdrawals/${id}/reject`, { reason }),
    completeWithdrawal: (id: string, notes?: string) =>
        api.put(`/api/v1/admin/withdrawals/${id}/complete`, { notes }),

    // Product management
    getProducts: () => api.get('/api/v1/admin/products'),
    createProduct: (data: { name: string; emoji?: string; amount: number; sort_order?: number }) =>
        api.post('/api/v1/admin/products', data),
    updateProduct: (id: string, data: { name?: string; emoji?: string; amount?: number; sort_order?: number; is_active?: boolean }) =>
        api.put(`/api/v1/admin/products/${id}`, data),
    deleteProduct: (id: string) => api.delete(`/api/v1/admin/products/${id}`),

    // Settings
    getSettings: () => api.get('/api/v1/admin/settings'),
    updateSettings: (data: { admin_fee_percent: number }) =>
        api.put('/api/v1/admin/settings', data),
};
