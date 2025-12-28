'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import { isAuthenticated, logout } from '@/lib/auth';
import { authApi } from '@/lib/api';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            if (isAuthenticated()) {
                try {
                    const response = await authApi.me();
                    setUser(response.data.data);
                    setIsLoggedIn(true);
                } catch {
                    setIsLoggedIn(false);
                }
            }
        };
        checkAuth();
    }, []);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div>
                            <Image
                                src="/logo.png"
                                alt="Jajanin"
                                width={180}
                                height={60}
                                className="h-16 w-auto"
                                priority
                            />
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/#features" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
                            Fitur
                        </Link>
                        <Link href="/#how-it-works" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
                            Cara Kerja
                        </Link>
                        <Link href="/#testimonials" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
                            Testimoni
                        </Link>
                        <Link href="/#faq" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
                            FAQ
                        </Link>

                        {isLoggedIn ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                                >
                                    {user?.image_url ? (
                                        <img
                                            src={user.image_url}
                                            alt={user.name}
                                            className="w-8 h-8 rounded-full"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                    <span>{user?.name}</span>
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 card py-2">
                                        <Link
                                            href="/dashboard"
                                            className="block px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition"
                                        >
                                            Dashboard
                                        </Link>
                                        {user?.username && (
                                            <Link
                                                href={`/${user.username}`}
                                                className="block px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition"
                                            >
                                                Halaman Donasi
                                            </Link>
                                        )}
                                        <Link
                                            href="/dashboard/settings"
                                            className="block px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition"
                                        >
                                            Pengaturan
                                        </Link>
                                        <hr className="my-2 border-gray-200 dark:border-dark-700" />
                                        <button
                                            onClick={logout}
                                            className="w-full text-left px-4 py-2 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-gray-100 dark:hover:bg-dark-800 transition flex items-center gap-2"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Keluar
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <ThemeToggle />
                                <Link href="/login" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
                                    Masuk
                                </Link>
                                <Link href="/register" className="btn-primary text-sm">
                                    Daftar Gratis
                                </Link>
                            </div>
                        )}
                        {isLoggedIn && <ThemeToggle />}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-gray-400"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-200 dark:border-dark-700">
                        <div className="flex flex-col gap-4">
                            <Link href="/#features" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
                                Fitur
                            </Link>
                            <Link href="/#how-it-works" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
                                Cara Kerja
                            </Link>
                            <Link href="/#testimonials" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
                                Testimoni
                            </Link>
                            <Link href="/#faq" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
                                FAQ
                            </Link>
                            {isLoggedIn ? (
                                <>
                                    <Link href="/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="text-left text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition"
                                    >
                                        Keluar
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
                                        Masuk
                                    </Link>
                                    <Link href="/register" className="btn-primary text-center">
                                        Daftar Gratis
                                    </Link>
                                </>
                            )}
                            <div className="pt-2 border-t border-gray-200 dark:border-dark-700">
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
