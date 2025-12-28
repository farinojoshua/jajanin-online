'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { paymentApi } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';

interface PaymentInfo {
    orderID: string;
    platformTradeNo: string;
    amount: number;
    creatorUsername: string;
}

export default function PaymentStatusPage() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'pending' | 'success' | 'failed'>('loading');
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        // Get payment info from session storage
        const stored = sessionStorage.getItem('pendingPayment');
        if (stored) {
            const info = JSON.parse(stored) as PaymentInfo;
            setPaymentInfo(info);
            // Check once on load
            checkStatusOnce(info.orderID);
        } else {
            setStatus('failed');
        }
    }, []);

    const checkStatusOnce = async (orderID: string) => {
        try {
            const response = await paymentApi.checkStatus(orderID);
            const { status: paymentStatus } = response.data.data;
            
            if (paymentStatus === '02') {
                setStatus('success');
                sessionStorage.removeItem('pendingPayment');
            } else if (paymentStatus === '09') {
                setStatus('failed');
                sessionStorage.removeItem('pendingPayment');
            } else {
                setStatus('pending');
            }
        } catch {
            setStatus('pending');
        }
    };

    const handleCheckStatus = async () => {
        if (!paymentInfo || isChecking) return;
        
        setIsChecking(true);
        try {
            const response = await paymentApi.checkStatus(paymentInfo.orderID);
            const { status: paymentStatus } = response.data.data;
            
            if (paymentStatus === '02') {
                setStatus('success');
                sessionStorage.removeItem('pendingPayment');
            } else if (paymentStatus === '09') {
                setStatus('failed');
                sessionStorage.removeItem('pendingPayment');
            } else {
                setStatus('pending');
            }
        } catch {
            setStatus('pending');
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                            Memuat...
                        </h1>
                    </>
                )}

                {status === 'pending' && paymentInfo && (
                    <>
                        <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                            Menunggu Pembayaran
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Silakan selesaikan pembayaran di aplikasi e-wallet kamu
                        </p>
                        <div className="bg-gray-100 dark:bg-dark-700 rounded-lg p-4 mb-6">
                            <p className="text-2xl font-bold text-primary-600">
                                {formatRupiah(paymentInfo.amount)}
                            </p>
                        </div>
                        <button
                            onClick={handleCheckStatus}
                            disabled={isChecking}
                            className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2 mb-3"
                        >
                            {isChecking ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                </svg>
                            )}
                            {isChecking ? 'Mengecek...' : 'Cek Status Pembayaran'}
                        </button>
                        <p className="text-xs text-gray-500">
                            Klik tombol di atas setelah menyelesaikan pembayaran
                        </p>
                    </>
                )}

                {status === 'success' && paymentInfo && (
                    <>
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-green-600 mb-2">
                            Pembayaran Berhasil! 🎉
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Terima kasih atas dukunganmu!
                        </p>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
                            <p className="text-2xl font-bold text-green-600">
                                {formatRupiah(paymentInfo.amount)}
                            </p>
                        </div>
                        <Link
                            href={`/${paymentInfo.creatorUsername}`}
                            className="btn-primary inline-block"
                        >
                            Kembali ke Halaman Creator
                        </Link>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-red-600 mb-2">
                            Pembayaran Gagal
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Pembayaran tidak dapat diproses. Silakan coba lagi.
                        </p>
                        <Link
                            href="/"
                            className="btn-primary inline-block"
                        >
                            Kembali ke Beranda
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
