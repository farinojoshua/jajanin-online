'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    Heart,
    Wallet,
    Settings,
    LogOut,
    TrendingUp,
    Users,
    DollarSign,
    ExternalLink,
    Tv,
    Copy,
    Check,
    Download,
    QrCode,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { authApi, donationApi, withdrawalApi } from '@/lib/api';
import { isAuthenticated, logout, User } from '@/lib/auth';
import { formatRupiah } from '@/lib/utils';
import StatsCard from '@/components/StatsCard';
import JajanCard from '@/components/JajanCard';
import DashboardLayout from '@/components/DashboardLayout';

interface Stats {
    total: {
        total_amount: number;
        total_donations: number;
        total_supporters: number;
    };
    monthly: {
        total_amount: number;
        total_donations: number;
    };
}

interface Donation {
    id: string;
    buyer_name: string;
    amount: number;
    quantity?: number;
    message: string;
    created_at: string;
    product_name?: string;
    product_emoji?: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [balance, setBalance] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const qrRef = useRef<HTMLDivElement>(null);

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const donationUrl = user?.username ? `${baseUrl}/${user.username}` : null;

    const copyLink = () => {
        if (donationUrl) {
            navigator.clipboard.writeText(donationUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const downloadQR = () => {
        if (!qrRef.current) return;
        const svg = qrRef.current.querySelector('svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = 512;
            canvas.height = 512;
            ctx?.fillRect(0, 0, canvas.width, canvas.height);
            ctx?.drawImage(img, 0, 0, 512, 512);

            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = `jajanin-${user?.username}-qr.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const [userRes, statsRes, donationsRes, balanceRes] = await Promise.all([
                    authApi.me(),
                    donationApi.getStats(),
                    donationApi.getMyDonations(1, 5),
                    withdrawalApi.getBalance(),
                ]);

                setUser(userRes.data.data);
                setStats(statsRes.data.data);
                setDonations(donationsRes.data.data?.donations || []);
                setBalance(balanceRes.data.data);
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router]);

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
                    product_name: alertData.product_name,
                    product_emoji: alertData.product_emoji,
                };

                // Prepend new donation to list (limit to 5)
                setDonations(prev => [newDonation, ...prev].slice(0, 5));

                // Update stats
                setStats(prev => prev ? {
                    ...prev,
                    total: {
                        ...prev.total,
                        total_amount: prev.total.total_amount + alertData.amount,
                        total_donations: prev.total.total_donations + 1,
                    },
                    monthly: {
                        ...prev.monthly,
                        total_amount: prev.monthly.total_amount + alertData.amount,
                        total_donations: prev.monthly.total_donations + 1,
                    },
                } : null);

                // Update balance
                setBalance((prev: any) => prev ? {
                    ...prev,
                    available_balance: (prev.available_balance || 0) + alertData.amount,
                } : null);
            } catch (err) {
                console.error('Failed to parse SSE alert:', err);
            }
        });

        return () => {
            eventSource.close();
        };
    }, [user?.username, isLoading]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <DashboardLayout user={user}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Selamat datang, {user?.name?.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Berikut ringkasan aktivitas halamanmu
                    </p>
                </div>

                {user?.username && (
                    <Link
                        href={`/${user.username}`}
                        target="_blank"
                        className="btn-secondary flex items-center gap-2"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Lihat Halaman Jajanin
                    </Link>
                )}
            </div>

            {/* Alert if no username */}
            {!user?.username && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-8 flex items-center justify-between">
                    <div>
                        <p className="text-yellow-400 font-medium">Lengkapi Profil Kamu</p>
                        <p className="text-yellow-400/70 text-sm">
                            Set username untuk membuat halaman jajanin
                        </p>
                    </div>
                    <Link href="/dashboard/settings" className="btn-primary text-sm">
                        Atur Sekarang
                    </Link>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Total Pendapatan"
                    value={stats?.total?.total_amount || 0}
                    icon={DollarSign}
                    isCurrency
                />
                <StatsCard
                    title="Jajanan Bulan Ini"
                    value={stats?.monthly?.total_amount || 0}
                    icon={TrendingUp}
                    isCurrency
                />
                <StatsCard
                    title="Total Jajanan"
                    value={stats?.total?.total_donations || 0}
                    icon={Heart}
                />
                <StatsCard
                    title="Total Supporter"
                    value={stats?.total?.total_supporters || 0}
                    icon={Users}
                />
            </div>

            {/* Balance Card */}
            <div className="card mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Saldo Tersedia</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                            {formatRupiah(balance?.available_balance || 0)}
                        </p>
                        {balance?.pending_withdrawals > 0 && (
                            <p className="text-gray-500 text-sm mt-1">
                                {formatRupiah(balance.pending_withdrawals)} dalam proses
                            </p>
                        )}
                    </div>
                    <Link href="/dashboard/withdraw" className="btn-primary">
                        Withdraw
                    </Link>
                </div>
            </div>

            {/* QR Code & Share Link */}
            {user?.username && (
                <div className="card mb-8">
                    <div className="flex items-start gap-8">
                        {/* QR Code */}
                        <div className="flex flex-col items-center">
                            <div
                                ref={qrRef}
                                className="bg-white p-4 rounded-xl shadow-lg"
                            >
                                <QRCodeSVG
                                    value={donationUrl || ''}
                                    size={140}
                                    level="H"
                                    includeMargin={false}
                                    fgColor="#FE6244"
                                    bgColor="#ffffff"
                                />
                            </div>
                            <button
                                onClick={downloadQR}
                                className="mt-3 text-sm text-gray-400 hover:text-primary-400 flex items-center gap-1 transition"
                            >
                                <Download className="w-4 h-4" />
                                Download QR
                            </button>
                        </div>

                        {/* Share Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <QrCode className="w-5 h-5 text-primary-400" />
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Bagikan Link Jajanin
                                </h2>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                Scan QR code atau bagikan link ini ke audiensmu untuk menerima dukungan
                            </p>

                            {/* URL Input with Copy */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={donationUrl || ''}
                                    readOnly
                                    className="flex-1 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none"
                                />
                                <button
                                    onClick={copyLink}
                                    className="btn-secondary px-4 py-2.5 flex items-center gap-2"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4 text-green-400" />
                                            <span className="text-green-400">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy
                                        </>
                                    )}
                                </button>
                                <Link
                                    href={`/${user.username}`}
                                    target="_blank"
                                    className="btn-primary px-4 py-2.5 flex items-center gap-2"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Buka
                                </Link>
                            </div>

                            {/* Quick Tips */}
                            <div className="mt-4 flex gap-4 text-xs text-gray-500">
                                <span>💡 Print QR untuk event offline</span>
                                <span>📱 Share ke bio Instagram/TikTok</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Donations */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Jajanan Terbaru</h2>
                    <Link
                        href="/dashboard/donations"
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 text-sm transition"
                    >
                        Lihat Semua
                    </Link>
                </div>

                {donations.length === 0 ? (
                    <div className="text-center py-12">
                        <Heart className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">Belum ada jajanan</p>
                        <p className="text-gray-500 text-sm">
                            Bagikan link halamanmu untuk mulai menerima dukungan
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {donations.map((donation) => (
                            <JajanCard key={donation.id} jajan={donation} />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
