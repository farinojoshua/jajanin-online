'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    Package,
    Wallet,
    Users,
    LogOut,
    Menu,
    X,
    Shield,
    Settings,
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { isAuthenticated, logout } from '@/lib/auth';
import ThemeToggle from '@/components/ThemeToggle';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    image_url?: string;
}

interface AdminLayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/products', icon: Package, label: 'Produk Jajan' },
    { href: '/admin/withdrawals', icon: Wallet, label: 'Withdrawals' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }

        const fetchUser = async () => {
            try {
                const response = await authApi.me();
                const userData = response.data.data;

                // Check if user is admin
                if (userData.role !== 'admin') {
                    router.push('/dashboard');
                    return;
                }

                setUser(userData);
            } catch (err) {
                router.push('/login');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-800 z-50 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <Shield className="w-6 h-6 text-red-500" />
                    <span className="font-bold text-gray-900 dark:text-white">Admin</span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-gray-600 dark:text-gray-400"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-dark-900 border-r border-gray-200 dark:border-dark-800 z-50 transform transition-transform duration-200 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center gap-2 px-4 border-b border-gray-200 dark:border-dark-800">
                    <Shield className="w-8 h-8 text-red-500" />
                    <span className="font-bold text-xl text-gray-900 dark:text-white">Admin Panel</span>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${isActive
                                        ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User & Actions */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-dark-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                            <p className="text-sm text-red-500">Admin</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Link
                            href="/dashboard"
                            className="flex-1 btn-secondary text-center text-sm"
                        >
                            User View
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
                <div className="p-6">{children}</div>
            </main>
        </div>
    );
}
