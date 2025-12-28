'use client';

import { useEffect, useState } from 'react';
import {
    Users,
    Package,
    Wallet,
    TrendingUp,
    DollarSign,
    Clock,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { adminApi } from '@/lib/adminApi';
import { formatRupiah } from '@/lib/utils';

interface Stats {
    total_users: number;
    total_creators: number;
    total_donations: number;
    total_revenue: number;
    pending_withdrawals: number;
    total_products: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await adminApi.getStats();
                setStats(response.data.data);
            } catch (err) {
                console.error('Failed to fetch stats', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    const statCards = [
        { label: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'blue' },
        { label: 'Total Kreator', value: stats?.total_creators || 0, icon: TrendingUp, color: 'green' },
        { label: 'Total Jajanan', value: stats?.total_donations || 0, icon: Package, color: 'purple' },
        { label: 'Total Revenue', value: formatRupiah(stats?.total_revenue || 0), icon: DollarSign, color: 'emerald' },
        { label: 'Pending Withdrawals', value: stats?.pending_withdrawals || 0, icon: Clock, color: 'orange' },
        { label: 'Total Produk', value: stats?.total_products || 0, icon: Wallet, color: 'pink' },
    ];

    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-500/10 text-blue-500',
        green: 'bg-green-500/10 text-green-500',
        purple: 'bg-purple-500/10 text-purple-500',
        emerald: 'bg-emerald-500/10 text-emerald-500',
        orange: 'bg-orange-500/10 text-orange-500',
        pink: 'bg-pink-500/10 text-pink-500',
    };

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400">Overview platform Jajanin</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((stat) => (
                    <div key={stat.label} className="card">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[stat.color]}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </AdminLayout>
    );
}
