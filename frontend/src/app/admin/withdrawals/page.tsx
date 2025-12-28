'use client';

import { useEffect, useState } from 'react';
import { Check, X, Clock, CheckCircle, XCircle, Wallet, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { adminApi } from '@/lib/adminApi';
import { formatRupiah } from '@/lib/utils';

interface Withdrawal {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    bank_name: string;
    bank_account: string;
    bank_holder: string;
    notes?: string;
    user?: {
        id: string;
        name: string;
        email: string;
    };
}

interface ModalState {
    isOpen: boolean;
    type: 'approve' | 'reject' | 'complete' | null;
    withdrawal: Withdrawal | null;
}

export default function AdminWithdrawals() {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<string>('');
    const [processing, setProcessing] = useState<string | null>(null);
    const [modal, setModal] = useState<ModalState>({ isOpen: false, type: null, withdrawal: null });
    const [inputValue, setInputValue] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    const fetchWithdrawals = async () => {
        try {
            const response = await adminApi.getWithdrawals(filter || undefined, page, limit);
            const data = response.data.data;
            setWithdrawals(data?.withdrawals || []);
            setTotalPages(data?.total_pages || 1);
        } catch (err) {
            console.error('Failed to fetch withdrawals', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWithdrawals();
    }, [filter, page]);

    const openModal = (type: 'approve' | 'reject' | 'complete', withdrawal: Withdrawal) => {
        setModal({ isOpen: true, type, withdrawal });
        setInputValue('');
    };

    const closeModal = () => {
        setModal({ isOpen: false, type: null, withdrawal: null });
        setInputValue('');
    };

    const handleConfirm = async () => {
        if (!modal.withdrawal) return;
        
        setProcessing(modal.withdrawal.id);
        try {
            switch (modal.type) {
                case 'approve':
                    await adminApi.approveWithdrawal(modal.withdrawal.id);
                    break;
                case 'reject':
                    await adminApi.rejectWithdrawal(modal.withdrawal.id, inputValue);
                    break;
                case 'complete':
                    await adminApi.completeWithdrawal(modal.withdrawal.id, inputValue);
                    break;
            }
            fetchWithdrawals();
            closeModal();
        } catch (err) {
            console.error('Failed to process', err);
        } finally {
            setProcessing(null);
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

    const statusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="flex items-center gap-1 text-yellow-500"><Clock className="w-4 h-4" /> Pending</span>;
            case 'approved':
            case 'processing':
                return <span className="flex items-center gap-1 text-blue-500"><Wallet className="w-4 h-4" /> Menunggu Transfer</span>;
            case 'completed':
                return <span className="flex items-center gap-1 text-green-500"><CheckCircle className="w-4 h-4" /> Completed</span>;
            case 'rejected':
                return <span className="flex items-center gap-1 text-red-500"><XCircle className="w-4 h-4" /> Rejected</span>;
            default:
                return status;
        }
    };

    const getModalConfig = () => {
        switch (modal.type) {
            case 'approve':
                return {
                    title: 'Approve Withdrawal',
                    description: 'Apakah Anda yakin ingin menyetujui penarikan ini?',
                    icon: <CheckCircle className="w-12 h-12 text-green-500" />,
                    confirmText: 'Approve',
                    confirmClass: 'bg-green-600 hover:bg-green-700 text-white',
                    showInput: false,
                };
            case 'reject':
                return {
                    title: 'Reject Withdrawal',
                    description: 'Apakah Anda yakin ingin menolak penarikan ini?',
                    icon: <AlertTriangle className="w-12 h-12 text-red-500" />,
                    confirmText: 'Reject',
                    confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
                    showInput: true,
                    inputLabel: 'Alasan penolakan (opsional)',
                    inputPlaceholder: 'Masukkan alasan penolakan...',
                };
            case 'complete':
                return {
                    title: 'Tandai Selesai',
                    description: 'Tandai penarikan ini sebagai selesai setelah transfer manual.',
                    icon: <CheckCircle className="w-12 h-12 text-green-500" />,
                    confirmText: 'Tandai Selesai',
                    confirmClass: 'bg-green-600 hover:bg-green-700 text-white',
                    showInput: true,
                    inputLabel: 'Nomor Referensi Transfer (opsional)',
                    inputPlaceholder: 'Contoh: TRF123456789',
                };
            default:
                return null;
        }
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

    const modalConfig = getModalConfig();

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Withdrawals</h1>
                    <p className="text-gray-600 dark:text-gray-400">Kelola permintaan withdrawal</p>
                </div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="input w-auto"
                >
                    <option value="">Semua Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Menunggu Transfer</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {/* Withdrawals Table */}
            <div className="card overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-dark-700">
                            <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">User</th>
                            <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Bank Info</th>
                            <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Amount</th>
                            <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                            <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Tanggal</th>
                            <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {withdrawals.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-gray-500">
                                    Tidak ada withdrawal.
                                </td>
                            </tr>
                        ) : (
                            withdrawals.map((w) => (
                                <tr key={w.id} className="border-b border-gray-100 dark:border-dark-800">
                                    <td className="py-4 px-4">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{w.user?.name}</p>
                                            <p className="text-sm text-gray-500">{w.user?.email}</p>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div>
                                            <p className="text-gray-900 dark:text-white">{w.bank_name}</p>
                                            <p className="text-sm text-gray-500">{w.bank_account} - {w.bank_holder}</p>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-right text-primary-600 dark:text-primary-400 font-semibold">
                                        {formatRupiah(w.amount)}
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <div>
                                            {statusBadge(w.status)}
                                            {w.notes && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {w.status === 'rejected' ? 'Alasan: ' : 'Ref: '}
                                                    {w.notes}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-center text-gray-500 text-sm">
                                        {formatDate(w.created_at)}
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        {w.status === 'pending' && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openModal('approve', w)}
                                                    disabled={processing === w.id}
                                                    className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition"
                                                    title="Approve"
                                                >
                                                    <Check className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => openModal('reject', w)}
                                                    disabled={processing === w.id}
                                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition"
                                                    title="Reject"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                        {(w.status === 'approved' || w.status === 'processing') && (
                                            <button
                                                onClick={() => openModal('complete', w)}
                                                disabled={processing === w.id}
                                                className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition"
                                                title="Tandai Selesai"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

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
            </div>

            {/* Modal */}
            {modal.isOpen && modalConfig && modal.withdrawal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={closeModal}
                    />
                    
                    {/* Modal Content */}
                    <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in duration-200">
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            {modalConfig.icon}
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                            {modalConfig.title}
                        </h2>

                        {/* Description */}
                        <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
                            {modalConfig.description}
                        </p>

                        {/* Withdrawal Info */}
                        <div className="bg-gray-100 dark:bg-dark-700 rounded-lg p-4 mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600 dark:text-gray-400">User</span>
                                <span className="font-medium text-gray-900 dark:text-white">{modal.withdrawal.user?.name}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600 dark:text-gray-400">Bank</span>
                                <span className="font-medium text-gray-900 dark:text-white">{modal.withdrawal.bank_name}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600 dark:text-gray-400">Rekening</span>
                                <span className="font-medium text-gray-900 dark:text-white">{modal.withdrawal.bank_account}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">Jumlah</span>
                                <span className="font-bold text-primary-600 dark:text-primary-400">{formatRupiah(modal.withdrawal.amount)}</span>
                            </div>
                        </div>

                        {/* Input Field (for reject/complete) */}
                        {modalConfig.showInput && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                    {modalConfig.inputLabel}
                                </label>
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    className="input w-full"
                                    placeholder={modalConfig.inputPlaceholder}
                                />
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={closeModal}
                                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-dark-600 transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={processing === modal.withdrawal.id}
                                className={`flex-1 px-4 py-3 rounded-lg font-medium transition disabled:opacity-50 ${modalConfig.confirmClass}`}
                            >
                                {processing === modal.withdrawal.id ? 'Memproses...' : modalConfig.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
