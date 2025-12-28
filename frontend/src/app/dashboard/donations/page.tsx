'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Heart,
    Search,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { authApi, donationApi } from '@/lib/api';
import { isAuthenticated, User } from '@/lib/auth';
import { formatRupiah } from '@/lib/utils';
import DashboardLayout from '@/components/DashboardLayout';

interface Donation {
    id: string;
    buyer_name: string;
    amount: number;
    quantity?: number;
    message: string;
    created_at: string;
    payment_status: string;
    product_name?: string;
    product_emoji?: string;
}

export default function DonationsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const limit = 10;

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const [userRes, donationsRes] = await Promise.all([
                    authApi.me(),
                    donationApi.getMyDonations(page, limit),
                ]);

                setUser(userRes.data.data);
                const data = donationsRes.data.data;
                setDonations(data?.donations || []);
                setTotalPages(data?.total_pages || 1);
            } catch (err) {
                console.error('Failed to fetch data', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router, page]);

    // SSE subscription for real-time donation updates
    useEffect(() => {
        if (!user?.username || isLoading) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const eventSource = new EventSource(`${apiUrl}/overlay/alert/${user.username}`);

        eventSource.addEventListener('alert', (event) => {
            try {
                const alertData = JSON.parse(event.data);
                
                // Convert alert data to donation format
                const newDonation: Donation = {
                    id: crypto.randomUUID(),
                    buyer_name: alertData.supporter_name,
                    amount: alertData.amount,
                    quantity: alertData.quantity,
                    message: alertData.message || '',
                    created_at: new Date().toISOString(),
                    payment_status: 'paid',
                    product_name: alertData.product_name,
                    product_emoji: alertData.product_emoji,
                };

                // Prepend new donation to list (only on page 1)
                if (page === 1) {
                    setDonations(prev => [newDonation, ...prev].slice(0, limit));
                }
            } catch (err) {
                console.error('Failed to parse SSE alert:', err);
            }
        });

        return () => {
            eventSource.close();
        };
    }, [user?.username, isLoading, page, limit]);

    const filteredDonations = donations.filter(
        (d) =>
            d.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.message?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Display product info or amount
    const getDisplayValue = (donation: Donation) => {
        if (donation.product_name) {
            return `${donation.quantity || 1}x ${donation.product_emoji || ''} ${donation.product_name}`;
        }
        return formatRupiah(donation.amount);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <DashboardLayout user={user}>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Riwayat Jajanan</h1>
                    <p className="text-gray-600 dark:text-gray-400">Semua jajanan yang kamu terima</p>
                </div>
            </div>

            {/* Search */}
            <div className="card mb-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari berdasarkan nama atau pesan..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input input-icon"
                    />
                </div>
            </div>

            {/* Donations List */}
            <div className="card">
                {filteredDonations.length === 0 ? (
                    <div className="text-center py-12">
                        <Heart className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">
                            {searchTerm ? 'Tidak ada jajanan yang cocok' : 'Belum ada jajanan'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-dark-700">
                                        <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Supporter</th>
                                        <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Item</th>
                                        <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Pesan</th>
                                        <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Jumlah</th>
                                        <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Tanggal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDonations.map((donation) => (
                                        <tr key={donation.id} className="border-b border-gray-100 dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-800/50 transition">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center">
                                                        {donation.product_emoji ? (
                                                            <span className="text-lg">{donation.product_emoji}</span>
                                                        ) : (
                                                            <span className="text-primary-600 dark:text-primary-400 font-semibold">
                                                                {donation.buyer_name.charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-gray-900 dark:text-white font-medium">{donation.buyer_name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-primary-600 dark:text-primary-400 font-medium">
                                                    {getDisplayValue(donation)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="text-gray-600 dark:text-gray-400 max-w-xs truncate">
                                                    {donation.message || '-'}
                                                </p>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <span className="text-gray-900 dark:text-white font-semibold">
                                                    {formatRupiah(donation.amount)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right text-gray-500 dark:text-gray-400 text-sm">
                                                {formatDate(donation.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-dark-800">
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
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}

