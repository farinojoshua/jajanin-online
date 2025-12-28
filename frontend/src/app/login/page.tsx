'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Mail, Lock, ArrowRight } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { authApi } from '@/lib/api';
import { setToken, isAuthenticated } from '@/lib/auth';

// Google Icon Component
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
    </svg>
);

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [error, setError] = useState('');

    // Google Login hook - MUST be called before any conditional returns
    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsGoogleLoading(true);
            setError('');

            try {
                // Get user info from Google
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await userInfoResponse.json();

                // Send to backend
                const response = await authApi.googleAuth({
                    google_id: userInfo.sub,
                    email: userInfo.email,
                    name: userInfo.name,
                    image_url: userInfo.picture || '',
                });

                const { token } = response.data.data;
                setToken(token);
                router.push('/dashboard');
            } catch (err: any) {
                setError(err.response?.data?.error || 'Gagal login dengan Google');
            } finally {
                setIsGoogleLoading(false);
            }
        },
        onError: () => {
            setError('Login dengan Google gagal. Silakan coba lagi.');
        },
    });

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated()) {
            router.push('/dashboard');
        } else {
            setIsCheckingAuth(false);
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await authApi.login({ email, password });
            const { token } = response.data.data;
            setToken(token);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Email atau password salah');
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading while checking auth
    if (isCheckingAuth) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </main>
        );
    }

    return (
        <main className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center">
                        <Heart className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">Jajanin</span>
                </Link>

                {/* Card */}
                <div className="card">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                        Selamat Datang Kembali
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
                        Masuk ke akun Jajanin kamu
                    </p>

                    {/* Google Login Button */}
                    <button
                        onClick={() => googleLogin()}
                        disabled={isGoogleLoading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-dark-800 border-2 border-gray-200 dark:border-dark-600 rounded-xl font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-700 hover:border-gray-300 dark:hover:border-dark-500 transition-all duration-200 shadow-sm hover:shadow-md mb-6"
                    >
                        {isGoogleLoading ? (
                            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <GoogleIcon />
                                <span>Masuk dengan Google</span>
                            </>
                        )}
                    </button>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white dark:bg-dark-900 text-gray-500">atau masuk dengan email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@contoh.com"
                                    className="input input-icon"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan password"
                                    className="input input-icon"
                                    required
                                />
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Masuk
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Register Link */}
                    <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
                        Belum punya akun?{' '}
                        <Link href="/register" className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition">
                            Daftar gratis
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
