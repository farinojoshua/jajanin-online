import Cookies from 'js-cookie';

export interface User {
    id: string;
    email: string;
    name: string;
    username: string | null;
    image_url: string | null;
    bio: string | null;
    role?: string;
    bank_name?: string;
    bank_account?: string;
    bank_holder?: string;
    stream_key?: string;
}

export const setToken = (token: string) => {
    Cookies.set('token', token, { expires: 7 });
};

export const getToken = (): string | undefined => {
    return Cookies.get('token');
};

export const removeToken = () => {
    Cookies.remove('token');
};

export const isAuthenticated = (): boolean => {
    return !!getToken();
};

export const logout = () => {
    removeToken();
    if (typeof window !== 'undefined') {
        window.location.href = '/';
    }
};
