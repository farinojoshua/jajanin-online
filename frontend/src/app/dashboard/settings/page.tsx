'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    User,
    Building,
    Save,
    Copy,
    Check,
    Link as LinkIcon,
    Twitter,
    Instagram,
    Youtube,
    Globe,
} from 'lucide-react';
import { authApi, userApi } from '@/lib/api';
import { isAuthenticated, User as UserType } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState<'profile' | 'social'>('profile');

    // Profile form
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');

    // Social links form
    const [twitterUrl, setTwitterUrl] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');

    // Bank form
    const [bankName, setBankName] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [bankHolder, setBankHolder] = useState('');

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }

        const fetchUser = async () => {
            try {
                const res = await authApi.me();
                const userData = res.data.data;
                setUser(userData);
                setName(userData.name || '');
                setUsername(userData.username || '');
                setBio(userData.bio || '');
                setTwitterUrl(userData.twitter_url || '');
                setInstagramUrl(userData.instagram_url || '');
                setYoutubeUrl(userData.youtube_url || '');
                setWebsiteUrl(userData.website_url || '');
                setBankName(userData.bank_name || '');
                setBankAccount(userData.bank_account || '');
                setBankHolder(userData.bank_holder || '');
            } catch (err) {
                console.error('Failed to fetch user', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await userApi.updateProfile({ name, username, bio });
            setUser(res.data.data);
            setMessage({ type: 'success', text: 'Profil berhasil diperbarui' });
        } catch (err: any) {
            setMessage({
                type: 'error',
                text: err.response?.data?.error || 'Gagal memperbarui profil',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSocialLinksSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await userApi.updateSocialLinks({
                twitter_url: twitterUrl,
                instagram_url: instagramUrl,
                youtube_url: youtubeUrl,
                website_url: websiteUrl,
            });
            setUser(res.data.data);
            setMessage({ type: 'success', text: 'Social links berhasil diperbarui' });
        } catch (err: any) {
            setMessage({
                type: 'error',
                text: err.response?.data?.error || 'Gagal memperbarui social links',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleBankSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await userApi.updateBank({
                bank_name: bankName,
                bank_account: bankAccount,
                bank_holder: bankHolder,
            });
            setUser(res.data.data);
            setMessage({ type: 'success', text: 'Informasi bank berhasil diperbarui' });
        } catch (err: any) {
            setMessage({
                type: 'error',
                text: err.response?.data?.error || 'Gagal memperbarui informasi bank',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const copyDonationLink = () => {
        if (user?.username) {
            navigator.clipboard.writeText(`${window.location.origin}/${user.username}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const tabs = [
        { id: 'profile', label: 'Profil & Bank', icon: User },
        { id: 'social', label: 'Social Media', icon: LinkIcon },
    ];

    return (
        <DashboardLayout user={user}>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Pengaturan</h1>

            {/* Donation Link */}
            {user?.username && (
                <div className="card mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Link Donasi</h2>
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/${user.username}`}
                            readOnly
                            className="input flex-1"
                        />
                        <button
                            onClick={copyDonationLink}
                            className="btn-secondary flex items-center gap-2"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Tersalin!' : 'Salin'}
                        </button>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${activeTab === tab.id
                                ? 'bg-primary-600 text-white'
                                : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Message Alert */}
            {message.text && (
                <div
                    className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                        ? 'bg-green-500/10 border border-green-500/50 text-green-600 dark:text-green-400'
                        : 'bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-400'
                        }`}
                >
                    {message.text}
                </div>
            )}

            {/* Tab Content */}
            <div className="card">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Left Column - Profile */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-primary-600/20 flex items-center justify-center">
                                    <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profil</h2>
                            </div>

                            <form onSubmit={handleProfileSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                        Nama
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="input"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                        Username
                                    </label>
                                    <div className="flex items-center">
                                        <span className="px-4 py-3 bg-gray-100 dark:bg-dark-800 border border-r-0 border-gray-200 dark:border-dark-700 rounded-l-lg text-gray-500 dark:text-gray-400">
                                            jajanin.id/
                                        </span>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                                            className="input rounded-l-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                        Bio
                                    </label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        rows={3}
                                        className="input resize-none"
                                        placeholder="Ceritakan sedikit tentang dirimu..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
                                </button>
                            </form>
                        </div>

                        {/* Right Column - Bank */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-primary-600/20 flex items-center justify-center">
                                    <Building className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Informasi Bank</h2>
                            </div>

                            <form onSubmit={handleBankSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                        Nama Bank
                                    </label>
                                    <select
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        className="input"
                                        required
                                    >
                                        <option value="">Pilih Bank</option>
                                        <option value="BCA">BCA</option>
                                        <option value="BNI">BNI</option>
                                        <option value="BRI">BRI</option>
                                        <option value="Mandiri">Mandiri</option>
                                        <option value="CIMB Niaga">CIMB Niaga</option>
                                        <option value="Permata">Permata</option>
                                        <option value="Danamon">Danamon</option>
                                        <option value="BSI">BSI</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                        Nomor Rekening
                                    </label>
                                    <input
                                        type="text"
                                        value={bankAccount}
                                        onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ''))}
                                        className="input"
                                        placeholder="1234567890"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                        Nama Pemilik Rekening
                                    </label>
                                    <input
                                        type="text"
                                        value={bankHolder}
                                        onChange={(e) => setBankHolder(e.target.value.toUpperCase())}
                                        className="input"
                                        placeholder="NAMA SESUAI BUKU REKENING"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSaving ? 'Menyimpan...' : 'Simpan Bank'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Social Links Tab */}
                {activeTab === 'social' && (
                    <>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-primary-600/20 flex items-center justify-center">
                                <LinkIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Social Media</h2>
                        </div>

                        <form onSubmit={handleSocialLinksSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                    <div className="flex items-center gap-2">
                                        <Twitter className="w-4 h-4" />
                                        Twitter / X
                                    </div>
                                </label>
                                <input
                                    type="url"
                                    value={twitterUrl}
                                    onChange={(e) => setTwitterUrl(e.target.value)}
                                    className="input"
                                    placeholder="https://twitter.com/username"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                    <div className="flex items-center gap-2">
                                        <Instagram className="w-4 h-4" />
                                        Instagram
                                    </div>
                                </label>
                                <input
                                    type="url"
                                    value={instagramUrl}
                                    onChange={(e) => setInstagramUrl(e.target.value)}
                                    className="input"
                                    placeholder="https://instagram.com/username"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                    <div className="flex items-center gap-2">
                                        <Youtube className="w-4 h-4" />
                                        YouTube
                                    </div>
                                </label>
                                <input
                                    type="url"
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                    className="input"
                                    placeholder="https://youtube.com/@channel"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4" />
                                        Website
                                    </div>
                                </label>
                                <input
                                    type="url"
                                    value={websiteUrl}
                                    onChange={(e) => setWebsiteUrl(e.target.value)}
                                    className="input"
                                    placeholder="https://yourwebsite.com"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? 'Menyimpan...' : 'Simpan Social Links'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
