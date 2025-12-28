'use client';

import { useState, useEffect } from 'react';
import { Save, Percent } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { adminApi } from '@/lib/adminApi';

interface Settings {
    id: number;
    admin_fee_percent: number;
    updated_at: string;
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [feePercent, setFeePercent] = useState<string>('0.5');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await adminApi.getSettings();
                const data = response.data.data;
                setSettings(data);
                setFeePercent(String(data.admin_fee_percent));
            } catch (err) {
                console.error('Failed to fetch settings', err);
                setMessage({ type: 'error', text: 'Gagal mengambil pengaturan' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);

        const percent = parseFloat(feePercent);
        if (isNaN(percent) || percent < 0 || percent > 100) {
            setMessage({ type: 'error', text: 'Persentase harus antara 0 - 100' });
            setIsSaving(false);
            return;
        }

        try {
            const response = await adminApi.updateSettings({ admin_fee_percent: percent });
            setSettings(response.data.data);
            setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' });
        } catch (err) {
            console.error('Failed to save settings', err);
            setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pengaturan Platform</h1>
                <p className="text-gray-600 dark:text-gray-400">Kelola pengaturan global platform Jajanin</p>
            </div>

            {/* Settings Card */}
            <div className="max-w-2xl">
                <div className="card">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Percent className="w-5 h-5 text-red-500" />
                        Biaya Admin
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Persentase Biaya Admin
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={feePercent}
                                    onChange={(e) => setFeePercent(e.target.value)}
                                    className="input w-32"
                                    placeholder="0.5"
                                />
                                <span className="text-gray-600 dark:text-gray-400 font-medium">%</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                                Biaya ini akan ditambahkan ke setiap pembayaran. Contoh: jika set 0.5%, maka pembayaran Rp 100.000 akan dikenakan biaya admin Rp 500.
                            </p>
                        </div>

                        {/* Preview */}
                        <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                            <p className="text-gray-900 dark:text-white">
                                Pembayaran Rp 100.000 → Biaya Admin: <span className="font-bold text-red-500">
                                    Rp {Math.ceil(100000 * (parseFloat(feePercent) || 0) / 100).toLocaleString('id-ID')}
                                </span>
                            </p>
                        </div>

                        {/* Message */}
                        {message && (
                            <div className={`p-3 rounded-lg ${
                                message.type === 'success' 
                                    ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                            }`}>
                                {message.text}
                            </div>
                        )}

                        {/* Last Updated */}
                        {settings?.updated_at && (
                            <p className="text-xs text-gray-500">
                                Terakhir diperbarui: {new Date(settings.updated_at).toLocaleString('id-ID')}
                            </p>
                        )}

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="btn-primary flex items-center gap-2"
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
