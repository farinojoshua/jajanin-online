'use client';

import { useState, useEffect } from 'react';
import { donationApi, authApi, paymentApi, configApi } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { getToken } from '@/lib/auth';
import QRCodeModal from './QRCodeModal';

interface JajanFormProps {
    creatorUsername: string;
    creatorName: string;
    productId?: string;
    fixedAmount?: number;
    fixedItemName?: string;
}

const MULTIPLIERS = [1, 2, 3, 5];

// Payment methods
const PAYMENT_METHODS = [
    { id: 'qris', name: 'QRIS', icon: '📱' },
    { id: 'gopay', name: 'GoPay', icon: '💚' },
    { id: 'shopee', name: 'ShopeePay', icon: '🧡' },
    { id: 'dana', name: 'DANA', icon: '💙' },
    { id: 'ovo', name: 'OVO', icon: '💜' },
    { id: 'linkaja', name: 'LinkAja', icon: '❤️' },
];

interface QRISPaymentData {
    qrisUrl: string;
    qrCode: string;
    expiredTime: string;
    orderID: string;
    amount: number;
    platformTradeNo: string;
}

export default function JajanForm({ creatorUsername, creatorName, productId, fixedAmount, fixedItemName }: JajanFormProps) {
    const [multiplier, setMultiplier] = useState<number>(1);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('qris');
    const [adminFeePercent, setAdminFeePercent] = useState<number>(0.5); // Default 0.5%

    // QRIS Modal state
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrisData, setQrisData] = useState<QRISPaymentData | null>(null);

    // Calculate amounts with dynamic admin fee
    const subtotal = (fixedAmount || 0) * multiplier;
    const adminFee = Math.ceil(subtotal * (adminFeePercent / 100));
    const totalAmount = subtotal + adminFee;

    // Fetch config on mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await configApi.getConfig();
                if (response.data?.data?.admin_fee_percent !== undefined) {
                    setAdminFeePercent(response.data.data.admin_fee_percent);
                }
            } catch {
                // Use default 0.5% on error
            }
        };
        fetchConfig();
    }, []);

    // Auto-fill name and email if user is logged in
    useEffect(() => {
        const fetchUserData = async () => {
            const token = getToken();
            if (token) {
                try {
                    const response = await authApi.me();
                    const user = response.data.data;
                    if (user) {
                        setName(user.name || '');
                        setEmail(user.email || '');
                        setIsLoggedIn(true);
                    }
                } catch {
                    // User not authenticated - ignore
                }
            }
        };
        fetchUserData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!fixedAmount || !productId) {
            setError('Silakan pilih produk terlebih dahulu');
            return;
        }

        if (!name.trim()) {
            setError('Nama tidak boleh kosong');
            return;
        }

        if (!email.trim() || !email.includes('@')) {
            setError('Email tidak valid');
            return;
        }

        // E-Wallet requires minimum Rp 10,000
        if (paymentMethod !== 'qris' && totalAmount < 10000) {
            setError('Minimum pembayaran E-Wallet adalah Rp 10.000');
            return;
        }

        setIsLoading(true);

        try {
            // Build redirect URL for e-wallet payments
            const redirectUrl = paymentMethod !== 'qris' 
                ? `${window.location.origin}/payment/status` 
                : '';

            const response = await donationApi.create({
                creator_username: creatorUsername,
                product_id: productId,
                buyer_name: name,
                buyer_email: email,
                amount: totalAmount,
                quantity: multiplier,
                message,
                payment_method: paymentMethod,
                redirect_url: redirectUrl,
            });

            const { qris_url, qr_code, expired_time, token, platform_trade_no, payment_url, payment_type } = response.data.data;

            // If e-wallet, redirect to payment URL
            if (payment_type && payment_type !== 'qris' && payment_url) {
                // Store order info for status page
                sessionStorage.setItem('pendingPayment', JSON.stringify({
                    orderID: token,
                    platformTradeNo: platform_trade_no,
                    amount: totalAmount,
                    creatorUsername,
                }));
                // Redirect to e-wallet
                window.location.href = payment_url;
                return;
            }

            // QRIS - show modal
            setQrisData({
                qrisUrl: qris_url,
                qrCode: qr_code,
                expiredTime: expired_time,
                orderID: token,
                amount: totalAmount,
                platformTradeNo: platform_trade_no,
            });
            setShowQRModal(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal memproses pembayaran');
        } finally {
            setIsLoading(false);
        }
    };

    // Close modal and clear data
    const handleCloseModal = () => {
        setShowQRModal(false);
        setQrisData(null);
    };

    // Cancel payment via API and clear data
    const handleCancelPayment = async () => {
        if (!qrisData) return;
        
        try {
            await paymentApi.cancel(qrisData.orderID, qrisData.platformTradeNo);
        } catch (err) {
            console.error('Failed to cancel payment:', err);
        }
        
        setShowQRModal(false);
        setQrisData(null);
    };

    // Payment success handler - don't close modal or clear data, let modal show success state
    const handlePaymentSuccess = () => {
        // Do nothing here - let QRCodeModal handle showing success state
        // The modal will stay open with success UI, user closes manually
    };

    // Reopen QRIS modal
    const handleReopenQRIS = () => {
        setShowQRModal(true);
    };

    if (!fixedAmount || !productId) {
        return (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-center">
                <p className="text-amber-600 dark:text-amber-400 font-medium mb-2">
                    👆 Pilih Jajan Dulu
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Pilih salah satu item di atas untuk jajanin {creatorName}
                </p>
            </div>
        );
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Product Display with Admin Fee Breakdown */}
                <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">
                        {fixedItemName || 'Jajan'}
                    </p>
                    
                    {/* Price Breakdown */}
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Subtotal {multiplier > 1 && `(${formatRupiah(fixedAmount)} × ${multiplier})`}</span>
                            <span>{formatRupiah(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Biaya Admin ({adminFeePercent}%)</span>
                            <span>{formatRupiah(adminFee)}</span>
                        </div>
                        <div className="border-t border-primary-500/30 pt-2 mt-2">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Total</span>
                                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                    {formatRupiah(totalAmount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Multiplier Buttons */}
                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Jumlah
                    </label>
                    <div className="flex gap-2">
                        {MULTIPLIERS.map((mult) => (
                            <button
                                key={mult}
                                type="button"
                                onClick={() => setMultiplier(mult)}
                                className={`flex-1 py-3 rounded-lg font-semibold transition border-2 ${multiplier === mult
                                    ? 'bg-primary-600 text-white border-primary-600'
                                    : 'bg-transparent text-gray-700 dark:text-gray-300 border-gray-200 dark:border-dark-700 hover:border-primary-500/50'
                                    }`}
                            >
                                ×{mult}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Metode Pembayaran
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {PAYMENT_METHODS.map((method) => (
                            <button
                                key={method.id}
                                type="button"
                                onClick={() => setPaymentMethod(method.id)}
                                className={`py-3 px-2 rounded-lg font-medium transition border-2 text-center ${
                                    paymentMethod === method.id
                                        ? 'bg-primary-600 text-white border-primary-600'
                                        : 'bg-transparent text-gray-700 dark:text-gray-300 border-gray-200 dark:border-dark-700 hover:border-primary-500/50'
                                }`}
                            >
                                <span className="text-lg block mb-1">{method.icon}</span>
                                <span className="text-xs">{method.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Buyer Info */}
                <div className="space-y-4">
                    {isLoggedIn && (
                        <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-3 text-violet-600 dark:text-violet-400 text-sm flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Menggunakan data dari akun kamu
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Nama Kamu
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Masukkan namamu"
                            className={`input ${isLoggedIn ? 'bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed' : ''}`}
                            required
                            readOnly={isLoggedIn}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@contoh.com"
                            className={`input ${isLoggedIn ? 'bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed' : ''}`}
                            required
                            readOnly={isLoggedIn}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Pesan (Opsional)
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={`Tulis pesan untuk ${creatorName}...`}
                            rows={3}
                            className="input resize-none"
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            🍽️ Jajanin {formatRupiah(totalAmount)}
                        </>
                    )}
                </button>

                <p className="text-center text-xs text-gray-500">
                    Pembayaran aman diproses oleh Paylabs
                </p>
            </form>

            {/* Pending Payment Banner - Show when modal is closed but QRIS exists */}
            {qrisData && !showQRModal && (
                <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <p className="text-amber-600 dark:text-amber-400 font-medium mb-3 text-center">
                        ⏳ Ada pembayaran yang belum selesai
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleReopenQRIS}
                            className="flex-1 py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition text-sm"
                        >
                            Buka QRIS
                        </button>
                        <button
                            onClick={handleCancelPayment}
                            className="py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition text-sm"
                        >
                            Batalkan
                        </button>
                    </div>
                </div>
            )}

            {/* QRIS Modal */}
            {qrisData && (
                <QRCodeModal
                    isOpen={showQRModal}
                    onClose={handleCloseModal}
                    onCancel={handleCancelPayment}
                    qrisUrl={qrisData.qrisUrl}
                    amount={qrisData.amount}
                    expiredTime={qrisData.expiredTime}
                    orderID={qrisData.orderID}
                    onPaymentSuccess={handlePaymentSuccess}
                />
            )}
        </>
    );
}
