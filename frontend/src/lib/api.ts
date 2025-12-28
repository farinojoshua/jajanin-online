import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = Cookies.get('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            Cookies.remove('token');
            // Only redirect to login if on a protected page (dashboard)
            // Don't redirect if on public pages like creator profiles
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                const isProtectedPage = currentPath.startsWith('/dashboard');
                if (isProtectedPage) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authApi = {
    register: (data: { email: string; password: string; name: string }) =>
        api.post('/api/v1/auth/register', data),

    login: (data: { email: string; password: string }) =>
        api.post('/api/v1/auth/login', data),

    googleAuth: (data: { google_id: string; email: string; name: string; image_url: string }) =>
        api.post('/api/v1/auth/google', data),

    me: () => api.get('/api/v1/auth/me'),
};

// User APIs
export const userApi = {
    getProfile: (username: string) =>
        api.get(`/api/v1/users/${username}`),

    updateProfile: (data: { name?: string; username?: string; bio?: string; image_url?: string }) =>
        api.put('/api/v1/users/profile', data),

    updateBank: (data: { bank_name: string; bank_account: string; bank_holder: string }) =>
        api.put('/api/v1/users/bank', data),

    updateSocialLinks: (data: {
        twitter_url?: string;
        instagram_url?: string;
        youtube_url?: string;
        website_url?: string;
    }) => api.put('/api/v1/users/social', data),



    getAlertSettings: (username: string) =>
        api.get(`/api/v1/users/${username}/alert-settings`),

    updateAlertSettings: (data: any) =>
        api.put('/api/v1/users/alert-settings', data),

    regenerateStreamKey: () =>
        api.post('/api/v1/users/regenerate-stream-key'),

    getAlertSettingsByStreamKey: (streamKey: string) =>
        api.get(`/overlay/settings/${streamKey}`),
};

// Donation APIs
export const donationApi = {
    create: (data: {
        creator_username: string;
        product_id?: string;
        buyer_name: string;
        buyer_email: string;
        amount: number;
        quantity?: number;
        message?: string;
        payment_method?: string;
        redirect_url?: string;
    }) => api.post('/api/v1/donations', data),

    getMyDonations: (page = 1, limit = 10) =>
        api.get(`/api/v1/donations?page=${page}&limit=${limit}`),

    getStats: () =>
        api.get('/api/v1/donations/stats'),

    getRecent: (username: string, limit = 5) =>
        api.get(`/api/v1/donations/recent/${username}?limit=${limit}`),
};

// Withdrawal APIs
export const withdrawalApi = {
    create: (data: { amount: number }) =>
        api.post('/api/v1/withdrawals', data),

    getAll: (page = 1, limit = 10) =>
        api.get(`/api/v1/withdrawals?page=${page}&limit=${limit}`),

    getBalance: () =>
        api.get('/api/v1/withdrawals/balance'),
};

// Config APIs (public settings)
export const configApi = {
    getConfig: () => api.get('/api/v1/config'),
};

// Product APIs (global jajan items)
export const productApi = {
    getAll: () => api.get('/api/v1/products'),
    getById: (id: string) => api.get(`/api/v1/products/${id}`),
};

// Payment APIs
export const paymentApi = {
    checkStatus: (orderID: string) => api.get(`/api/v1/payment/status/${orderID}`),
    cancel: (merchantTradeNo: string, platformTradeNo: string) => 
        api.post('/api/v1/payment/cancel', { merchant_trade_no: merchantTradeNo, platform_trade_no: platformTradeNo }),
};

export default api;

