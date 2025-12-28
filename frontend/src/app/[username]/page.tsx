'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, Twitter, Instagram, Youtube, Globe, Coffee } from 'lucide-react';
import Navbar from '@/components/Navbar';
import JajanForm from '@/components/JajanForm';
import JajanCard from '@/components/JajanCard';
import { userApi, donationApi, productApi } from '@/lib/api';

interface Creator {
    id: string;
    username: string;
    name: string;
    bio: string;
    image_url: string;
    twitter_url?: string;
    instagram_url?: string;
    youtube_url?: string;
    website_url?: string;
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

interface QuickItem {
    id: string;
    name: string;
    emoji: string;
    amount: number;
    is_active: boolean;
}

export default function CreatorPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const username = params.username as string;
    const itemId = searchParams.get('item');

    const [creator, setCreator] = useState<Creator | null>(null);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [quickItems, setQuickItems] = useState<QuickItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<QuickItem | null>(null);
    const [inactiveItemMessage, setInactiveItemMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [creatorRes, donationsRes, quickItemsRes] = await Promise.all([
                    userApi.getProfile(username),
                    donationApi.getRecent(username, 5),
                    productApi.getAll(),  // Global products
                ]);

                setCreator(creatorRes.data.data);
                setDonations(donationsRes.data.data || []);
                setQuickItems(quickItemsRes.data.data || []);



                // Handle item query param - check if item is active
                const items = quickItemsRes.data.data || [];
                if (itemId) {
                    // First check if item exists in active items list
                    const found = items.find((item: QuickItem) => item.id === itemId);
                    if (found && found.is_active) {
                        setSelectedItem(found);
                    } else {
                        // Item might exist but be inactive, try to fetch it directly
                        try {
                            const itemRes = await productApi.getById(itemId);
                            const itemData = itemRes.data.data;
                            if (itemData && !itemData.is_active) {
                                setInactiveItemMessage(`Item "${itemData.emoji} ${itemData.name}" sudah tidak aktif`);
                            }
                        } catch {
                            // Item doesn't exist at all
                            setInactiveItemMessage('Link item donasi tidak valid atau sudah dihapus');
                        }
                    }
                }
            } catch (err) {
                setError('Kreator tidak ditemukan');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [username, itemId]);

    // SSE subscription for real-time donation updates
    useEffect(() => {
        if (!username || isLoading) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const eventSource = new EventSource(`${apiUrl}/overlay/alert/${username}`);

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
            } catch (err) {
                console.error('Failed to parse SSE alert:', err);
            }
        });

        eventSource.onerror = () => {
            // Connection lost, will auto-reconnect
        };

        return () => {
            eventSource.close();
        };
    }, [username, isLoading]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const hasSocialLinks = creator && (
        creator.twitter_url ||
        creator.instagram_url ||
        creator.youtube_url ||
        creator.website_url
    );


    if (isLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </main>
        );
    }

    if (error || !creator) {
        return (
            <main className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-dark-800 flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-10 h-10 text-gray-400 dark:text-gray-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Kreator Tidak Ditemukan</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Username &quot;{username}&quot; tidak terdaftar di Jajanin
                    </p>
                    <Link href="/" className="btn-primary">
                        Kembali ke Beranda
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen">
            <Navbar />

            <div className="pt-24 pb-12 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-5 gap-8">
                        {/* Left Column - Creator Info & Donations */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Creator Card */}
                            <div className="card text-center">
                                {/* Avatar */}
                                <div className="relative w-24 h-24 mx-auto mb-4">
                                    {creator.image_url ? (
                                        <img
                                            src={creator.image_url}
                                            alt={creator.name}
                                            className="w-full h-full rounded-full object-cover border-4 border-primary-600/30"
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-primary-600/20 flex items-center justify-center border-4 border-primary-600/30">
                                            <Heart className="w-10 h-10 text-primary-400" />
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full gradient-bg flex items-center justify-center border-2 border-white dark:border-dark-900">
                                        <Heart className="w-4 h-4 text-white" />
                                    </div>
                                </div>

                                {/* Name & Username */}
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{creator.name}</h1>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">@{creator.username}</p>

                                {/* Bio */}
                                {creator.bio && (
                                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-6">{creator.bio}</p>
                                )}

                                {/* Social Links */}
                                {hasSocialLinks && (
                                    <div className="flex items-center justify-center gap-3">
                                        {creator.twitter_url && (
                                            <a
                                                href={creator.twitter_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10 transition"
                                                title="Twitter"
                                            >
                                                <Twitter className="w-5 h-5" />
                                            </a>
                                        )}
                                        {creator.instagram_url && (
                                            <a
                                                href={creator.instagram_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#E4405F] hover:bg-[#E4405F]/10 transition"
                                                title="Instagram"
                                            >
                                                <Instagram className="w-5 h-5" />
                                            </a>
                                        )}
                                        {creator.youtube_url && (
                                            <a
                                                href={creator.youtube_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#FF0000] hover:bg-[#FF0000]/10 transition"
                                                title="YouTube"
                                            >
                                                <Youtube className="w-5 h-5" />
                                            </a>
                                        )}
                                        {creator.website_url && (
                                            <a
                                                href={creator.website_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-primary-600 hover:bg-primary-600/10 transition"
                                                title="Website"
                                            >
                                                <Globe className="w-5 h-5" />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Recent Supporters */}
                            <div className="card">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Supporter Terbaru
                                </h2>

                                {donations.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Heart className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-600 dark:text-gray-400">Belum ada jajanan</p>
                                        <p className="text-gray-500 text-sm">Jadilah yang pertama!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {donations.map((donation) => (
                                            <JajanCard key={donation.id} jajan={donation} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Jajan Form */}
                        <div className="lg:col-span-3">
                            <div className="card lg:sticky lg:top-24">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                                    Jajanin {creator.name}
                                </h2>

                                {/* Inactive Item Warning */}
                                {inactiveItemMessage && (
                                    <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                                <Coffee className="w-5 h-5 text-yellow-500" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    Item Tidak Aktif
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {inactiveItemMessage}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Quick Items Selector */}
                                {quickItems.length > 0 ? (
                                    <>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            Pilih jajanan:
                                        </p>
                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            {quickItems.filter(item => item.is_active).map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => setSelectedItem(item)}
                                                    className={`p-4 rounded-xl border-2 text-left transition ${selectedItem?.id === item.id
                                                        ? 'border-primary-500 bg-primary-500/10'
                                                        : 'border-gray-200 dark:border-dark-700 hover:border-primary-500/50'
                                                        }`}
                                                >
                                                    <span className="text-2xl block mb-2">{item.emoji}</span>
                                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-primary-600 dark:text-primary-400 font-bold text-sm">
                                                        {formatCurrency(item.amount)}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8 mb-6 bg-gray-50 dark:bg-dark-800 rounded-xl">
                                        <Coffee className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-600 dark:text-gray-400 font-medium">
                                            Belum ada produk jajan
                                        </p>
                                        <p className="text-gray-500 text-sm mt-1">
                                            {creator.name} belum menambahkan produk jajan
                                        </p>
                                    </div>
                                )}

                                {/* Only show form if there are items */}
                                {quickItems.length > 0 && (
                                    <JajanForm
                                        creatorUsername={creator.username}
                                        creatorName={creator.name}
                                        productId={selectedItem?.id}
                                        fixedAmount={selectedItem?.amount}
                                        fixedItemName={selectedItem ? `${selectedItem.emoji} ${selectedItem.name}` : undefined}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
