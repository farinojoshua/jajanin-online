import { useEffect, useState } from 'react';
import { formatRupiah, timeAgo } from '@/lib/utils';
import { Heart } from 'lucide-react';

interface Jajan {
    id: string;
    buyer_name: string;
    amount: number;
    quantity?: number;
    message: string;
    created_at: string;
    product_name?: string;
    product_emoji?: string;
}

interface JajanCardProps {
    jajan: Jajan;
}

export default function JajanCard({ jajan }: JajanCardProps) {
    // Auto-update timeAgo every 30 seconds
    const [, setTick] = useState(0);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, 30000); // Update every 30 seconds
        
        return () => clearInterval(interval);
    }, []);

    // Display product info if available, otherwise show amount
    const displayValue = jajan.product_name 
        ? `${jajan.quantity || 1}x ${jajan.product_emoji || ''} ${jajan.product_name}`
        : formatRupiah(jajan.amount);

    return (
        <div className="card animate-fade-in">
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                    {jajan.product_emoji ? (
                        <span className="text-lg">{jajan.product_emoji}</span>
                    ) : (
                        <Heart className="w-5 h-5 text-primary-400" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                            {jajan.buyer_name}
                        </h4>
                        <span className="text-primary-400 font-medium whitespace-nowrap">
                            {displayValue}
                        </span>
                    </div>

                    {jajan.message && (
                        <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm line-clamp-2">
                            {jajan.message}
                        </p>
                    )}

                    <span className="text-gray-500 text-xs mt-2 block">
                        {timeAgo(jajan.created_at)}
                    </span>
                </div>
            </div>
        </div>
    );
}
