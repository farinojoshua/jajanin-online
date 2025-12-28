import { formatRupiah, formatNumber } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: number;
    icon: LucideIcon;
    isCurrency?: boolean;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

export default function StatsCard({
    title,
    value,
    icon: Icon,
    isCurrency = false,
    trend,
}: StatsCardProps) {
    return (
        <div className="card">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {isCurrency ? formatRupiah(value) : formatNumber(value)}
                    </p>
                    {trend && (
                        <p
                            className={`text-sm mt-2 ${trend.isPositive ? 'text-green-400' : 'text-red-400'
                                }`}
                        >
                            {trend.isPositive ? '+' : '-'}
                            {trend.value}% dari bulan lalu
                        </p>
                    )}
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary-600/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary-400" />
                </div>
            </div>
        </div>
    );
}
