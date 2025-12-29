'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the payment status content with SSR disabled
const PaymentStatusContent = dynamic(() => import('./PaymentStatusContent'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
                <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                    Memuat...
                </h1>
            </div>
        </div>
    ),
});

export default function PaymentStatusPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                        Memuat...
                    </h1>
                </div>
            </div>
        }>
            <PaymentStatusContent />
        </Suspense>
    );
}
