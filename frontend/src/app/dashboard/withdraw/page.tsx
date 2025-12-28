'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Wallet,
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { authApi, withdrawalApi } from '@/lib/api';
import { isAuthenticated, User } from '@/lib/auth';
import { formatRupiah } from '@/lib/utils';
import DashboardLayout from '@/components/DashboardLayout';

interface Balance {
    total_earned: number;
    total_withdrawn: number;
    pending_withdrawals: number;
    available_balance: number;
}

interface Withdrawal {
    id: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    created_at: string;
    processed_at?: string;
    notes?: string;
}

export default function WithdrawPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [balance, setBalance] = useState<Balance | null>(null);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [page, setPage] = useState(1);
    const limit = 10;

    const fetchData = async () => {
        try {
            const [userRes, balanceRes, withdrawalsRes] = await Promise.all([
                authApi.me(),
                withdrawalApi.getBalance(),
                withdrawalApi.getAll(page, limit),
            ]);

            setUser(userRes.data.data);
            setBalance(balanceRes.data.data);
            setWithdrawals(withdrawalsRes.data.data?.withdrawals || []);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }

        fetchData();
    }, [router, page]);

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        const withdrawAmount = parseInt(amount);

        if (withdrawAmount < 50000) {
            setMessage({ type: 'error', text: 'Minimal penarikan Rp 50.000' });
            setIsSubmitting(false);
            return;
        }

        if (withdrawAmount > (balance?.available_balance || 0)) {
            setMessage({ type: 'error', text: 'Saldo tidak mencukupi' });
            setIsSubmitting(false);
            return;
        }

        try {
            await withdrawalApi.create({ amount: withdrawAmount });
            setMessage({ type: 'success', text: 'Permintaan penarikan berhasil dibuat!' });
            setAmount('');
            fetchData();
        } catch (err: any) {
            setMessage({
                type: 'error',
                text: err.response?.data?.error || 'Gagal membuat permintaan penarikan',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'pending':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'rejected':
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Clock className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed':
                return 'Selesai';
            case 'pending':
                return 'Menunggu Persetujuan';
            case 'approved':
            case 'processing':
                return 'Sedang Ditransfer';
            case 'rejected':
                return 'Ditolak';
            default:
                return status;
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500/20 text-green-600 dark:text-green-400';
            case 'pending':
                return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400';
            case 'approved':
            case 'processing':
                return 'bg-blue-500/20 text-blue-600 dark:text-blue-400';
            case 'rejected':
                return 'bg-red-500/20 text-red-600 dark:text-red-400';
            default:
                return 'bg-gray-500/20 text-gray-600 dark:text-gray-400';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
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
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Penarikan Saldo</h1>
                <p className="text-gray-600 dark:text-gray-400">Tarik saldomu ke rekening bank</p>
            </div>

            {/* Message */}
            {message.text && (
                <div
                    className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success'
                        ? 'bg-green-500/10 border border-green-500/50 text-green-600 dark:text-green-400'
                        : 'bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-400'
                        }`}
                >
                    {message.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    {message.text}
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Balance & Withdraw Form */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Balance Card */}
                    <div className="card">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Saldo</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">Saldo Tersedia</p>
                                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                    {formatRupiah(balance?.available_balance || 0)}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-dark-700">
                                <div>
                                    <p className="text-gray-500 text-xs">Total Pendapatan</p>
                                    <p className="text-gray-900 dark:text-white font-medium">
                                        {formatRupiah(balance?.total_earned || 0)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs">Sudah Ditarik</p>
                                    <p className="text-gray-900 dark:text-white font-medium">
                                        {formatRupiah(balance?.total_withdrawn || 0)}
                                    </p>
                                </div>
                            </div>
                            {(balance?.pending_withdrawals || 0) > 0 && (
                                <div className="pt-4 border-t border-gray-200 dark:border-dark-700">
                                    <p className="text-yellow-600 dark:text-yellow-400 text-sm flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {formatRupiah(balance?.pending_withdrawals || 0)} sedang diproses
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Withdraw Form */}
                    <div className="card">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tarik Saldo</h2>

                        {!user?.bank_name ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                                    Kamu belum mengatur informasi bank. Silakan atur di halaman pengaturan.
                                </p>
                                <Link href="/dashboard/settings" className="btn-primary inline-block mt-3 text-sm">
                                    Atur Bank
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleWithdraw} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                        Jumlah Penarikan
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                            Rp
                                        </span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="input input-icon"
                                            placeholder="50000"
                                            min="50000"
                                            max={balance?.available_balance || 0}
                                            required
                                        />
                                    </div>
                                    <p className="text-gray-500 text-xs mt-1">Minimum Rp 50.000</p>
                                </div>

                                <div className="bg-gray-100 dark:bg-dark-800 rounded-lg p-4">
                                    <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-2">Rekening Tujuan</p>
                                    <p className="text-gray-900 dark:text-white font-medium">{user?.bank_name}</p>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">{user?.bank_account}</p>
                                    <p className="text-gray-500 text-sm">{user?.bank_holder}</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || (balance?.available_balance || 0) < 50000}
                                    className="btn-primary w-full disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Memproses...' : 'Tarik Saldo'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Withdrawal History */}
                <div className="lg:col-span-2">
                    <div className="card">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Riwayat Penarikan</h2>

                        {withdrawals.length === 0 ? (
                            <div className="text-center py-12">
                                <Wallet className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-600 dark:text-gray-400">Belum ada riwayat penarikan</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-dark-700">
                                                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Jumlah</th>
                                                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                                                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Tanggal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {withdrawals.map((withdrawal) => (
                                                <tr key={withdrawal.id} className="border-b border-gray-100 dark:border-dark-800">
                                                    <td className="py-4 px-4">
                                                        <span className="text-gray-900 dark:text-white font-semibold">
                                                            {formatRupiah(withdrawal.amount)}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div>
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(withdrawal.status)}`}>
                                                                {getStatusIcon(withdrawal.status)}
                                                                {getStatusText(withdrawal.status)}
                                                            </span>
                                                            {withdrawal.notes && (
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                    {withdrawal.status === 'rejected' ? 'Alasan: ' : 'Ref: '}
                                                                    {withdrawal.notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-right text-gray-500 dark:text-gray-400 text-sm">
                                                        {formatDate(withdrawal.created_at)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-dark-800">
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">Halaman {page}</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="btn-secondary px-3 py-2 disabled:opacity-50"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setPage((p) => p + 1)}
                                            disabled={withdrawals.length < limit}
                                            className="btn-secondary px-3 py-2 disabled:opacity-50"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
