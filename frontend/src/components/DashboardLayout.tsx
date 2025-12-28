'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Heart,
    Wallet,
    Settings,
    LogOut,
    Tv,
    ChevronLeft,
    ChevronRight,
    Coffee,
    Shield,
} from 'lucide-react';
import { logout, User } from '@/lib/auth';
import ThemeToggle from './ThemeToggle';

interface DashboardLayoutProps {
    user: User | null;
    children: React.ReactNode;
}

const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/donations', icon: Heart, label: 'Jajanan' },
    { href: '/dashboard/overlay', icon: Tv, label: 'Overlay' },
    { href: '/dashboard/withdraw', icon: Wallet, label: 'Withdraw' },
    { href: '/dashboard/settings', icon: Settings, label: 'Pengaturan' },
];

export default function DashboardLayout({ user, children }: DashboardLayoutProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Load collapsed state from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved !== null) {
            setIsCollapsed(JSON.parse(saved));
        }
    }, []);

    // Save collapsed state to localStorage
    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    };

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard';
        }
        return pathname.startsWith(href);
    };

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-dark-950">
            {/* Sidebar */}
            <aside
                className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-dark-900 border-r border-gray-200 dark:border-dark-800 fixed h-full z-40 transition-all duration-300 ease-in-out`}
            >
                <div className="p-4">
                    {/* Logo & Toggle */}
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-8`}>
                        <Link href="/" className="flex items-center">
                            {isCollapsed ? (
                                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                                    <Heart className="w-6 h-6 text-white" />
                                </div>
                            ) : (
                                <Image
                                    src="/logo.png"
                                    alt="Jajanin"
                                    width={140}
                                    height={48}
                                    className="h-12 w-auto"
                                    priority
                                />
                            )}
                        </Link>
                        {!isCollapsed && (
                            <button
                                onClick={toggleCollapse}
                                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white transition"
                                title="Collapse sidebar"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Expand button when collapsed */}
                    {isCollapsed && (
                        <button
                            onClick={toggleCollapse}
                            className="w-full flex justify-center p-2 mb-4 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white transition"
                            title="Expand sidebar"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    )}

                    {/* Navigation */}
                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center ${isCollapsed ? 'justify-center' : ''} gap-3 px-4 py-3 rounded-lg transition ${active
                                        ? 'bg-primary-600/10 text-primary-600 dark:text-primary-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    {!isCollapsed && <span>{item.label}</span>}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* User Section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-dark-800">
                    {/* Theme Toggle */}
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4`}>
                        {!isCollapsed && <span className="text-sm text-gray-500 dark:text-gray-400">Tema</span>}
                        <ThemeToggle />
                    </div>

                    {isCollapsed ? (
                        // Collapsed: Show avatar only
                        <div className="flex flex-col items-center gap-3">
                            {user?.image_url ? (
                                <img
                                    src={user.image_url}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full"
                                    title={user.name}
                                />
                            ) : (
                                <div
                                    className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold"
                                    title={user?.name}
                                >
                                    {user?.name?.charAt(0)}
                                </div>
                            )}
                            {user?.role === 'admin' && (
                                <Link
                                    href="/admin"
                                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition"
                                    title="Admin Panel"
                                >
                                    <Shield className="w-5 h-5" />
                                </Link>
                            )}
                            <button
                                onClick={logout}
                                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-800 transition"
                                title="Keluar"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        // Expanded: Show full user info
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                {user?.image_url ? (
                                    <img
                                        src={user.image_url}
                                        alt={user.name}
                                        className="w-10 h-10 rounded-full"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                                        {user?.name?.charAt(0)}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-gray-900 dark:text-white font-medium truncate">{user?.name}</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{user?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {user?.role === 'admin' && (
                                    <Link
                                        href="/admin"
                                        className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition text-sm"
                                    >
                                        <Shield className="w-4 h-4" />
                                        Admin
                                    </Link>
                                )}
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition text-sm"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Keluar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-64'} p-8 transition-all duration-300 ease-in-out`}>
                {children}
            </main>
        </div>
    );
}
