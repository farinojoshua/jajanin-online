'use client';

import { useEffect, useState } from 'react';
import { User, Shield, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { adminApi } from '@/lib/adminApi';

interface UserData {
    id: string;
    name: string;
    email: string;
    username: string;
    role: string;
    image_url?: string;
    created_at: string;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    const fetchUsers = async () => {
        try {
            const response = await adminApi.getUsers(page, limit);
            const data = response.data.data;
            setUsers(data?.users || []);
            setTotalPages(data?.total_pages || 1);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page]);

    const filteredUsers = users.filter(
        (u) =>
            u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
                    <p className="text-gray-600 dark:text-gray-400">Daftar semua pengguna</p>
                </div>
            </div>

            {/* Search */}
            <div className="card mb-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari nama, email, atau username..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-12"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="card overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-dark-700">
                            <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">User</th>
                            <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Email</th>
                            <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Username</th>
                            <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Role</th>
                            <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-500">
                                    {searchTerm ? 'Tidak ada user yang cocok' : 'Tidak ada user'}
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="border-b border-gray-100 dark:border-dark-800">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center overflow-hidden">
                                                {user.image_url ? (
                                                    <img src={user.image_url} alt={user.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-5 h-5 text-primary-400" />
                                                )}
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-white">{user.name || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                                        {user.email}
                                    </td>
                                    <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                                        {user.username ? `@${user.username}` : '-'}
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        {user.role === 'admin' ? (
                                            <span className="flex items-center justify-center gap-1 text-red-500">
                                                <Shield className="w-4 h-4" /> Admin
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">User</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4 text-right text-gray-500 text-sm">
                                        {formatDate(user.created_at)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-dark-800 px-4 pb-4">
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Halaman {page} dari {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="btn-secondary px-3 py-2 disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                                    .map((p, idx, arr) => (
                                        <span key={p} className="flex items-center">
                                            {idx > 0 && arr[idx - 1] !== p - 1 && (
                                                <span className="px-1 text-gray-400">...</span>
                                            )}
                                            <button
                                                onClick={() => setPage(p)}
                                                className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition ${
                                                    p === page
                                                        ? 'bg-primary-600 text-white'
                                                        : 'hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        </span>
                                    ))}
                            </div>
                            
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="btn-secondary px-3 py-2 disabled:opacity-50"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
