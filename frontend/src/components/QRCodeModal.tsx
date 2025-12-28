'use client';

import { useEffect, useState } from 'react';
import { formatRupiah } from '@/lib/utils';
import { paymentApi } from '@/lib/api';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCancel?: () => void;  // Cancel order via API
    qrisUrl: string;
    amount: number;
    expiredTime: string;
    orderID: string;
    onPaymentSuccess?: () => void;
}

export default function QRCodeModal({
    isOpen,
    onClose,
    onCancel,
    qrisUrl,
    amount,
    expiredTime,
    orderID,
    onPaymentSuccess
}: QRCodeModalProps) {
    const [timeLeft, setTimeLeft] = useState<string>('15:00');
    const [isExpired, setIsExpired] = useState(false);
    const [isPaid, setIsPaid] = useState(false);
    const [startTime] = useState<number>(() => Date.now()); // Capture when modal opened

    // 15 minute countdown from when modal opens
    const COUNTDOWN_DURATION = 15 * 60 * 1000; // 15 minutes in ms

    useEffect(() => {
        if (!isOpen) return;

        const calculateTimeLeft = () => {
            const elapsed = Date.now() - startTime;
            const remaining = COUNTDOWN_DURATION - elapsed;

            if (remaining <= 0) {
                setIsExpired(true);
                setTimeLeft('00:00');
                return;
            }

            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [isOpen, startTime]);

    // Check payment status manually (no auto-polling, webhook will handle it in production)
    const [isChecking, setIsChecking] = useState(false);

    const checkStatus = async () => {
        if (!orderID || isChecking) return;
        
        setIsChecking(true);
        try {
            const response = await paymentApi.checkStatus(orderID);

            const data = response.data?.data;
            
            // Check if status is 02 (success)
            if (data?.status === '02') {

                setIsPaid(true);
                if (onPaymentSuccess) {
                    onPaymentSuccess();
                }
            } else {

            }
        } catch (error) {
            console.error('Error checking payment status:', error);
        } finally {
            setIsChecking(false);
        }
    };

    // Check once when modal opens
    useEffect(() => {
        if (!isOpen || isExpired || isPaid || !orderID) return;
        checkStatus();
    }, [isOpen]);

    if (!isOpen) return null;

    // Success state
    if (isPaid) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                    <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4 text-white">
                        <h3 className="text-lg font-bold">Pembayaran Berhasil! 🎉</h3>
                    </div>
                    <div className="p-6 space-y-6 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{formatRupiah(amount)}</p>
                        <p className="text-gray-600 dark:text-gray-400">Terima kasih atas dukungannya!</p>
                        <button
                            onClick={onClose}
                            className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-4 text-white">
                    <h3 className="text-lg font-bold">Scan QRIS untuk Bayar</h3>
                    <p className="text-sm text-white/80">Order: {orderID}</p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Amount */}
                    <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Pembayaran</p>
                        <p className="text-3xl font-bold text-primary-600">{formatRupiah(amount)}</p>
                    </div>

                    {/* QR Code */}
                    <div className="flex justify-center">
                        {isExpired ? (
                            <div className="w-64 h-64 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                                <div className="text-center p-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-red-500 font-semibold">QRIS Expired</p>
                                    <p className="text-sm text-gray-500 mt-1">Silakan buat transaksi baru</p>
                                </div>
                            </div>
                        ) : qrisUrl ? (
                            <div className="p-3 bg-white rounded-xl shadow-inner">
                                <img
                                    src={qrisUrl}
                                    alt="QRIS Code"
                                    className="w-64 h-64 object-contain"
                                />
                            </div>
                        ) : (
                            <div className="w-64 h-64 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                                <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Timer */}
                    {!isExpired && (
                        <div className="text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Berlaku selama</p>
                            <p className={`text-2xl font-mono font-bold ${parseInt(timeLeft.split(':')[0]) < 5 ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>
                                {timeLeft}
                            </p>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            Cara Bayar
                        </h4>
                        <ol className="text-sm text-blue-700 dark:text-blue-300/80 space-y-1 list-decimal list-inside">
                            <li>Buka aplikasi e-wallet/m-banking</li>
                            <li>Pilih menu scan QR/QRIS</li>
                            <li>Scan kode QR di atas</li>
                            <li>Konfirmasi pembayaran</li>
                        </ol>
                    </div>
                </div>

                {/* Footer - Three buttons */}
                <div className="px-6 pb-6 space-y-3">
                    <button
                        onClick={checkStatus}
                        disabled={isChecking}
                        className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2"
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
                    <button
                        onClick={onClose}
                        className="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Tutup (Buka M-Banking Dulu)
                    </button>
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-red-500 dark:text-red-400 rounded-xl font-semibold transition"
                        >
                            Batalkan Pembayaran
                        </button>
                    )}
                </div>

                {/* Powered by */}
                <div className="px-6 pb-4 text-center">
                    <p className="text-xs text-gray-400">
                        Pembayaran aman diproses oleh Paylabs
                    </p>
                </div>
            </div>
        </div>
    );
}
