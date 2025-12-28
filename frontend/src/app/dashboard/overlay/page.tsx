'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Tv,
    Copy,
    Check,
    ExternalLink,
    Play,
    Loader2,
    Volume2,
    VolumeX,
    Bell,
    QrCode,
    BookOpen,
} from 'lucide-react';
import { authApi, userApi } from '@/lib/api';
import { isAuthenticated, User } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import { getTTSService, TTSSettings } from '@/lib/tts';
import {
    AlertSettings,
    DEFAULT_ALERT_SETTINGS,
    FONT_OPTIONS,
    ANIMATION_OPTIONS,
    SOUND_OPTIONS,
    THEME_PRESETS,
} from '@/lib/alertSettings';

type TabType = 'alert' | 'qr' | 'guide';

export default function OverlaySettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState<string | null>(null);
    const [testSending, setTestSending] = useState(false);
    const [testResult, setTestResult] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('alert');

    // TTS State
    const ttsRef = useRef(getTTSService());
    const [ttsSettings, setTtsSettings] = useState<TTSSettings>({
        enabled: true,
        voiceName: '',
        rate: 1.0,
        volume: 1.0,
        speakAmount: true,
        speakMessage: true,
    });
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [ttsTestPlaying, setTtsTestPlaying] = useState(false);

    // Alert Settings State
    const [alertSettings, setAlertSettings] = useState<AlertSettings>(DEFAULT_ALERT_SETTINGS);
    const [alertSettingsLoading, setAlertSettingsLoading] = useState(false);
    const [alertSettingsSaving, setAlertSettingsSaving] = useState(false);
    const [alertSettingsMessage, setAlertSettingsMessage] = useState('');

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    const tabs = [
        { id: 'alert' as TabType, label: 'Alert Box', icon: Bell, description: 'Notifikasi donasi' },
        { id: 'qr' as TabType, label: 'QR Code', icon: QrCode, description: 'Widget QR' },
        { id: 'guide' as TabType, label: 'Panduan', icon: BookOpen, description: 'Cara pakai OBS' },
    ];

    // Load TTS settings and voices
    useEffect(() => {
        const tts = ttsRef.current;
        setTtsSettings(tts.getSettings());

        // Wait for voices to load
        const loadVoices = () => {
            const voices = tts.getVoices();
            setAvailableVoices(voices);
        };

        loadVoices();
        // Some browsers load voices asynchronously
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
            return () => {
                window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
            };
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }

        const fetchUser = async () => {
            try {
                const res = await authApi.me();
                setUser(res.data.data);
            } catch (err) {
                console.error('Failed to fetch user', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    // Load alert settings after user is loaded
    useEffect(() => {
        if (!user?.username) return;

        const loadAlertSettings = async () => {
            setAlertSettingsLoading(true);
            try {
                const res = await userApi.getAlertSettings(user.username);
                if (res.data.data) {
                    setAlertSettings(res.data.data);
                }
            } catch (err) {
                console.error('Failed to load alert settings', err);
            } finally {
                setAlertSettingsLoading(false);
            }
        };

        loadAlertSettings();
    }, [user?.username]);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    // Update individual alert setting and save
    const updateAlertSetting = async <K extends keyof AlertSettings>(
        key: K,
        value: AlertSettings[K]
    ) => {
        const newSettings = { ...alertSettings, [key]: value };
        setAlertSettings(newSettings);

        // Auto-save after 500ms debounce
        setAlertSettingsMessage('');
    };

    // Save all alert settings
    const saveAlertSettings = async () => {
        setAlertSettingsSaving(true);
        setAlertSettingsMessage('');
        try {
            await userApi.updateAlertSettings(alertSettings);
            setAlertSettingsMessage('✅ Settings saved!');
            setTimeout(() => setAlertSettingsMessage(''), 3000);
        } catch (err) {
            setAlertSettingsMessage('❌ Failed to save settings');
        } finally {
            setAlertSettingsSaving(false);
        }
    };

    // Apply theme preset
    const applyThemePreset = (preset: typeof THEME_PRESETS[0]) => {
        setAlertSettings({
            ...alertSettings,
            theme: 'custom',
            background_color: preset.bg,
            text_color: preset.text,
            accent_color: preset.accent,
        });
    };

    const sendTestAlert = async () => {
        if (!user?.stream_key) return;

        setTestSending(true);
        setTestResult(null);

        try {
            const response = await fetch(`${apiUrl}/overlay/test/${user.stream_key}`, {
                method: 'POST',
            });
            const data = await response.json();
            if (data.success) {
                setTestResult(`✅ Test alert sent! (${data.client_count} client connected)`);
            } else {
                setTestResult('❌ Failed to send test alert');
            }
        } catch (error) {
            setTestResult('❌ Error: Could not connect to server');
        } finally {
            setTestSending(false);
        }
    };

    const updateTTSSettings = (updates: Partial<TTSSettings>) => {
        const newSettings = { ...ttsSettings, ...updates };
        setTtsSettings(newSettings);
        ttsRef.current.saveSettings(newSettings);
    };

    const testTTS = async () => {
        setTtsTestPlaying(true);
        try {
            await ttsRef.current.speak('Ini adalah test Text to Speech dari Jajanin');
        } catch (error) {
            console.error('TTS test failed:', error);
        } finally {
            setTtsTestPlaying(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Alert overlay now uses stream_key for security (instead of username)
    const alertOverlayUrl = user?.stream_key ? `${baseUrl}/overlay/alert/${user.stream_key}` : null;
    const qrOverlayUrl = user?.username ? `${baseUrl}/overlay/qr/${user.username}` : null;
    const goalOverlayUrl = user?.username ? `${baseUrl}/overlay/goal/${user.username}` : null;
    const donationUrl = user?.username ? `${baseUrl}/${user.username}` : null;

    return (
        <DashboardLayout user={user}>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Tv className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                    Overlay Streaming
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Tambahkan widget overlay ke OBS atau streaming software kamu
                </p>
            </div>

            {!user?.username ? (
                <div className="card bg-yellow-500/10 border-yellow-500/50">
                    <p className="text-yellow-400 font-medium">⚠️ Username Belum Diatur</p>
                    <p className="text-yellow-400/70 text-sm mt-1">
                        Kamu perlu mengatur username terlebih dahulu untuk menggunakan overlay.
                    </p>
                    <Link href="/dashboard/settings" className="btn-primary inline-block mt-4 text-sm">
                        Atur Username
                    </Link>
                </div>
            ) : (
                <div>
                    {/* Tab Navigation */}
                    <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-dark-800 rounded-xl overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all whitespace-nowrap flex-1 justify-center ${isActive
                                        ? 'bg-white dark:bg-dark-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-6">
                        {/* Alert Box Tab */}
                        {activeTab === 'alert' && (
                            <>
                                <div className="card">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                🔔 Alert Box
                                            </h2>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                                Tampilkan notifikasi animasi saat ada donasi masuk
                                            </p>
                                        </div>
                                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                                            Aktif
                                        </span>
                                    </div>

                                    {/* URL Box */}
                                    <div className="bg-gray-100 dark:bg-dark-800 rounded-lg p-4 mb-4">
                                        <label className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                                            URL Overlay
                                        </label>
                                        <div className="flex items-center gap-2 mt-2">
                                            <input
                                                type="text"
                                                value={alertOverlayUrl || ''}
                                                readOnly
                                                className="flex-1 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white text-sm focus:outline-none"
                                            />
                                            <button
                                                onClick={() => alertOverlayUrl && copyToClipboard(alertOverlayUrl, 'alert')}
                                                disabled={!alertOverlayUrl}
                                                className="btn-secondary px-3 py-2 flex items-center gap-2"
                                            >
                                                {copied === 'alert' ? (
                                                    <Check className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                                {copied === 'alert' ? 'Copied!' : 'Copy'}
                                            </button>
                                            {alertOverlayUrl && (
                                                <Link
                                                    href={alertOverlayUrl}
                                                    target="_blank"
                                                    className="btn-secondary px-3 py-2"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* Test Button */}
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={sendTestAlert}
                                            disabled={testSending}
                                            className="btn-primary flex items-center gap-2"
                                        >
                                            {testSending ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Play className="w-4 h-4" />
                                            )}
                                            Test Alert
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowPreview(true);
                                                setPreviewVisible(true);
                                                setTimeout(() => {
                                                    setPreviewVisible(false);
                                                    setTimeout(() => setShowPreview(false), 500);
                                                }, 5000);
                                            }}
                                            className="btn-secondary flex items-center gap-2"
                                        >
                                            <Tv className="w-4 h-4" />
                                            Preview
                                        </button>
                                        {testResult && (
                                            <span className="text-sm text-gray-400">{testResult}</span>
                                        )}
                                    </div>

                                    {/* Preview Box */}
                                    {showPreview && (
                                        <div className="mt-6 p-4 bg-gray-100 dark:bg-dark-800 rounded-lg">
                                            <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-4">Preview</p>
                                            <div className="preview-container">
                                                <div className={`preview-alert-box ${previewVisible ? 'preview-show' : 'preview-hide'}`}>
                                                    <div className="preview-alert-glow" />
                                                    <div className="preview-alert-content">
                                                        <div className="preview-alert-icon">
                                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
                                                            </svg>
                                                        </div>
                                                        <div className="preview-alert-header">
                                                            <span className="preview-alert-jajan">☕ Jajanin 3 Kopi</span>
                                                            <span className="preview-alert-from">dari Anonymous</span>
                                                        </div>
                                                        <div className="preview-alert-message">
                                                            "Semangat streamingnya! 🔥"
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <style jsx>{`
                                .preview-container {
                                    display: flex;
                                    justify-content: center;
                                    align-items: center;
                                    min-height: 200px;
                                    background: repeating-conic-gradient(#1a1a2e 0% 25%, #16162a 0% 50%) 50% / 20px 20px;
                                    border-radius: 8px;
                                    padding: 24px;
                                }

                                .preview-alert-box {
                                    position: relative;
                                    background: linear-gradient(135deg, rgba(254, 98, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%);
                                    border-radius: 16px;
                                    padding: 20px 28px;
                                    min-width: 300px;
                                    max-width: 380px;
                                    box-shadow: 
                                        0 0 30px rgba(254, 98, 68, 0.5),
                                        0 0 60px rgba(254, 98, 68, 0.3),
                                        0 20px 40px rgba(0, 0, 0, 0.3);
                                    border: 2px solid rgba(255, 255, 255, 0.2);
                                    transform-origin: top center;
                                }

                                .preview-show {
                                    animation: previewSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                                }

                                .preview-hide {
                                    animation: previewSlideOut 0.5s ease-in forwards;
                                }

                                @keyframes previewSlideIn {
                                    0% { opacity: 0; transform: translateY(-30px) scale(0.8); }
                                    50% { transform: translateY(5px) scale(1.02); }
                                    100% { opacity: 1; transform: translateY(0) scale(1); }
                                }

                                @keyframes previewSlideOut {
                                    0% { opacity: 1; transform: translateY(0) scale(1); }
                                    100% { opacity: 0; transform: translateY(-20px) scale(0.9); }
                                }

                                .preview-alert-glow {
                                    position: absolute;
                                    inset: -2px;
                                    border-radius: 18px;
                                    background: linear-gradient(135deg, #FF8A70, #FE6244, #E54D2E, #C73E22);
                                    opacity: 0.7;
                                    z-index: -1;
                                    animation: previewGlowPulse 2s ease-in-out infinite;
                                }

                                @keyframes previewGlowPulse {
                                    0%, 100% { opacity: 0.5; filter: blur(8px); }
                                    50% { opacity: 0.8; filter: blur(12px); }
                                }

                                .preview-alert-content {
                                    position: relative;
                                    z-index: 1;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    gap: 10px;
                                }

                                .preview-alert-icon {
                                    width: 40px;
                                    height: 40px;
                                    color: #fbbf24;
                                    filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.5));
                                    animation: previewStarSpin 1s ease-out;
                                }

                                @keyframes previewStarSpin {
                                    0% { transform: rotate(-180deg) scale(0); opacity: 0; }
                                    50% { transform: rotate(20deg) scale(1.2); }
                                    100% { transform: rotate(0deg) scale(1); opacity: 1; }
                                }

                                .preview-alert-header {
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    gap: 2px;
                                }

                                .preview-alert-jajan {
                                    font-size: 24px;
                                    font-weight: 800;
                                    color: #fbbf24;
                                    text-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
                                    animation: previewAmountPop 0.5s ease-out 0.2s both;
                                }

                                .preview-alert-from {
                                    font-size: 18px;
                                    font-weight: 700;
                                    color: white;
                                    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                                }

                                @keyframes previewAmountPop {
                                    0% { transform: scale(0); }
                                    50% { transform: scale(1.2); }
                                    100% { transform: scale(1); }
                                }

                                .preview-alert-message {
                                    font-size: 14px;
                                    color: rgba(255, 255, 255, 0.9);
                                    text-align: center;
                                    font-style: italic;
                                    padding: 6px 12px;
                                    background: rgba(0, 0, 0, 0.2);
                                    border-radius: 6px;
                                    animation: previewMessageFadeIn 0.5s ease-out 0.3s both;
                                }

                                @keyframes previewMessageFadeIn {
                                    0% { opacity: 0; transform: translateY(10px); }
                                    100% { opacity: 1; transform: translateY(0); }
                                }
                            `}</style>
                                </div>

                                {/* TTS Settings */}
                                <div className="card">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                🔊 Text-to-Speech (TTS)
                                            </h2>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                                Bacakan pesan donasi secara otomatis di stream
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => updateTTSSettings({ enabled: !ttsSettings.enabled })}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition ${ttsSettings.enabled
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-gray-500/20 text-gray-400'
                                                }`}
                                        >
                                            {ttsSettings.enabled ? 'Aktif' : 'Nonaktif'}
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Voice Selector */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                                Suara
                                            </label>
                                            <select
                                                value={ttsSettings.voiceName}
                                                onChange={(e) => updateTTSSettings({ voiceName: e.target.value })}
                                                className="w-full bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            >
                                                {availableVoices.map((voice) => (
                                                    <option key={voice.name} value={voice.name}>
                                                        {voice.name} ({voice.lang})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Rate Slider */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                                Kecepatan: {ttsSettings.rate}x
                                            </label>
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="2"
                                                step="0.1"
                                                value={ttsSettings.rate}
                                                onChange={(e) => updateTTSSettings({ rate: parseFloat(e.target.value) })}
                                                className="w-full accent-primary-500"
                                            />
                                        </div>

                                        {/* Volume Slider */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                                Volume: {Math.round(ttsSettings.volume * 100)}%
                                            </label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={ttsSettings.volume}
                                                onChange={(e) => updateTTSSettings({ volume: parseFloat(e.target.value) })}
                                                className="w-full accent-primary-500"
                                            />
                                        </div>

                                        {/* Checkboxes */}
                                        <div className="flex gap-6">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={ttsSettings.speakAmount}
                                                    onChange={(e) => updateTTSSettings({ speakAmount: e.target.checked })}
                                                    className="w-4 h-4 rounded accent-primary-500"
                                                />
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Bacakan nama & jumlah</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={ttsSettings.speakMessage}
                                                    onChange={(e) => updateTTSSettings({ speakMessage: e.target.checked })}
                                                    className="w-4 h-4 rounded accent-primary-500"
                                                />
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Bacakan pesan</span>
                                            </label>
                                        </div>

                                        {/* Test Button */}
                                        <button
                                            onClick={testTTS}
                                            disabled={ttsTestPlaying}
                                            className="btn-secondary flex items-center gap-2"
                                        >
                                            {ttsTestPlaying ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : ttsSettings.enabled ? (
                                                <Volume2 className="w-4 h-4" />
                                            ) : (
                                                <VolumeX className="w-4 h-4" />
                                            )}
                                            Test TTS
                                        </button>
                                    </div>
                                </div>

                                {/* Alert Customization Settings */}
                                <div className="card">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                🎨 Kustomisasi Alert
                                            </h2>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                                Sesuaikan tampilan alert box sesuai keinginanmu
                                            </p>
                                        </div>
                                        {alertSettingsLoading && (
                                            <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        {/* Live Preview */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                                                👁️ Live Preview
                                            </label>
                                            <div className="bg-gray-900 rounded-xl p-6 flex items-center justify-center min-h-[180px]">
                                                <div
                                                    style={{
                                                        background: alertSettings.background_color,
                                                        fontFamily: alertSettings.font_family === 'inter' ? "'Inter', sans-serif" :
                                                            alertSettings.font_family === 'poppins' ? "'Poppins', sans-serif" :
                                                                alertSettings.font_family === 'roboto' ? "'Roboto', sans-serif" :
                                                                    alertSettings.font_family === 'montserrat' ? "'Montserrat', sans-serif" :
                                                                        "'Comic Sans MS', cursive",
                                                        borderRadius: '16px',
                                                        padding: '20px 28px',
                                                        minWidth: '280px',
                                                        maxWidth: '350px',
                                                        boxShadow: `0 0 30px ${alertSettings.background_color}80, 0 20px 40px rgba(0,0,0,0.3)`,
                                                        border: '2px solid rgba(255,255,255,0.2)',
                                                        textAlign: 'center' as const,
                                                    }}
                                                >
                                                    <div style={{ marginBottom: '8px' }}>
                                                        <svg
                                                            viewBox="0 0 24 24"
                                                            style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                color: alertSettings.accent_color,
                                                                margin: '0 auto',
                                                                filter: `drop-shadow(0 0 8px ${alertSettings.accent_color}80)`,
                                                            }}
                                                        >
                                                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
                                                        </svg>
                                                    </div>
                                                    <div
                                                        style={{
                                                            color: alertSettings.accent_color,
                                                            fontSize: alertSettings.font_size === 'small' ? '20px' : alertSettings.font_size === 'large' ? '30px' : '24px',
                                                            fontWeight: 800,
                                                            textShadow: `0 0 15px ${alertSettings.accent_color}80`,
                                                            marginBottom: '4px',
                                                        }}
                                                    >
                                                        ☕ Jajanin 3 Kopi
                                                    </div>
                                                    <div
                                                        style={{
                                                            color: alertSettings.text_color,
                                                            fontSize: alertSettings.font_size === 'small' ? '16px' : alertSettings.font_size === 'large' ? '22px' : '18px',
                                                            fontWeight: 700,
                                                            marginBottom: '8px',
                                                        }}
                                                    >
                                                        dari Nama Supporter
                                                    </div>
                                                    <div
                                                        style={{
                                                            color: alertSettings.text_color,
                                                            opacity: 0.9,
                                                            fontSize: alertSettings.font_size === 'small' ? '12px' : alertSettings.font_size === 'large' ? '16px' : '14px',
                                                            fontStyle: 'italic',
                                                            background: 'rgba(0,0,0,0.2)',
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                        }}
                                                    >
                                                        "Ini adalah contoh pesan"
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                                                Preview akan berubah sesuai setting yang dipilih
                                            </p>
                                        </div>
                                        {/* Theme Presets */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                                                Tema Preset
                                            </label>
                                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                                {THEME_PRESETS.map((preset, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => applyThemePreset(preset)}
                                                        className="flex flex-col items-center gap-1 p-2 rounded-lg border-2 border-gray-200 dark:border-dark-700 hover:border-primary-500 transition"
                                                        title={preset.name}
                                                    >
                                                        <div
                                                            className="w-8 h-8 rounded-lg shadow-md"
                                                            style={{ background: preset.bg }}
                                                        />
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-center">
                                                            {preset.name.split(' ')[0]}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Custom Colors */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                                    Background
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="color"
                                                        value={alertSettings.background_color}
                                                        onChange={(e) => updateAlertSetting('background_color', e.target.value)}
                                                        className="w-12 h-10 rounded cursor-pointer"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={alertSettings.background_color}
                                                        onChange={(e) => updateAlertSetting('background_color', e.target.value)}
                                                        className="flex-1 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                                    Teks
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="color"
                                                        value={alertSettings.text_color}
                                                        onChange={(e) => updateAlertSetting('text_color', e.target.value)}
                                                        className="w-12 h-10 rounded cursor-pointer"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={alertSettings.text_color}
                                                        onChange={(e) => updateAlertSetting('text_color', e.target.value)}
                                                        className="flex-1 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                                    Aksen (Jumlah)
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="color"
                                                        value={alertSettings.accent_color}
                                                        onChange={(e) => updateAlertSetting('accent_color', e.target.value)}
                                                        className="w-12 h-10 rounded cursor-pointer"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={alertSettings.accent_color}
                                                        onChange={(e) => updateAlertSetting('accent_color', e.target.value)}
                                                        className="flex-1 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Font & Animation */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                                    Font
                                                </label>
                                                <select
                                                    value={alertSettings.font_family}
                                                    onChange={(e) => updateAlertSetting('font_family', e.target.value)}
                                                    className="w-full bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                >
                                                    {FONT_OPTIONS.map((font) => (
                                                        <option key={font.value} value={font.value}>
                                                            {font.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                                    Ukuran Font
                                                </label>
                                                <select
                                                    value={alertSettings.font_size}
                                                    onChange={(e) => updateAlertSetting('font_size', e.target.value as any)}
                                                    className="w-full bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                >
                                                    <option value="small">Kecil</option>
                                                    <option value="medium">Sedang</option>
                                                    <option value="large">Besar</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                                    Animasi
                                                </label>
                                                <select
                                                    value={alertSettings.animation}
                                                    onChange={(e) => updateAlertSetting('animation', e.target.value as any)}
                                                    className="w-full bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                >
                                                    {ANIMATION_OPTIONS.map((anim) => (
                                                        <option key={anim.value} value={anim.value}>
                                                            {anim.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Duration */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                                Durasi Tampil: {alertSettings.duration} detik
                                            </label>
                                            <input
                                                type="range"
                                                min="3"
                                                max="10"
                                                value={alertSettings.duration}
                                                onChange={(e) => updateAlertSetting('duration', parseInt(e.target.value))}
                                                className="w-full accent-primary-500"
                                            />
                                        </div>

                                        {/* Sound Settings */}
                                        <div className="border-t border-gray-200 dark:border-dark-700 pt-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                    🔔 Sound Effect
                                                </label>
                                                <button
                                                    onClick={() => updateAlertSetting('sound_enabled', !alertSettings.sound_enabled)}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${alertSettings.sound_enabled
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : 'bg-gray-500/20 text-gray-400'
                                                        }`}
                                                >
                                                    {alertSettings.sound_enabled ? 'Aktif' : 'Nonaktif'}
                                                </button>
                                            </div>

                                            {alertSettings.sound_enabled && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
                                                            Pilih Sound
                                                        </label>
                                                        <select
                                                            value={alertSettings.sound_file}
                                                            onChange={(e) => updateAlertSetting('sound_file', e.target.value)}
                                                            className="w-full bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                        >
                                                            {SOUND_OPTIONS.map((sound) => (
                                                                <option key={sound.value} value={sound.value}>
                                                                    {sound.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
                                                            Volume: {alertSettings.sound_volume}%
                                                        </label>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            value={alertSettings.sound_volume}
                                                            onChange={(e) => updateAlertSetting('sound_volume', parseInt(e.target.value))}
                                                            className="w-full accent-primary-500"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Save Button */}
                                        <div className="flex items-center gap-4 pt-2">
                                            <button
                                                onClick={saveAlertSettings}
                                                disabled={alertSettingsSaving}
                                                className="btn-primary flex items-center gap-2"
                                            >
                                                {alertSettingsSaving ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Check className="w-4 h-4" />
                                                )}
                                                Simpan Settings
                                            </button>
                                            {alertSettingsMessage && (
                                                <span className={`text-sm ${alertSettingsMessage.includes('✅') ? 'text-green-500' : 'text-red-500'}`}>
                                                    {alertSettingsMessage}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* QR Code Tab */}
                        {activeTab === 'qr' && (
                            <div className="card">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            📱 QR Code Widget
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                            Tampilkan QR code di stream agar penonton bisa scan untuk donasi
                                        </p>
                                    </div>
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                                        Aktif
                                    </span>
                                </div>

                                {/* QR Code Generator */}
                                {donationUrl && (
                                    <div className="mb-6">
                                        <QRCodeGenerator
                                            url={donationUrl}
                                            username={user?.username || ''}
                                        />
                                    </div>
                                )}

                                {/* URL Box for OBS */}
                                <div className="bg-gray-100 dark:bg-dark-800 rounded-lg p-4 mb-4">
                                    <label className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                                        URL Overlay untuk OBS
                                    </label>
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            type="text"
                                            value={qrOverlayUrl || ''}
                                            readOnly
                                            className="flex-1 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white text-sm focus:outline-none"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(qrOverlayUrl!, 'qr')}
                                            className="btn-secondary px-3 py-2 flex items-center gap-2"
                                        >
                                            {copied === 'qr' ? (
                                                <Check className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                            {copied === 'qr' ? 'Copied!' : 'Copy'}
                                        </button>
                                        <Link
                                            href={qrOverlayUrl!}
                                            target="_blank"
                                            className="btn-secondary px-3 py-2"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>

                                {/* OBS Settings */}
                                <div className="bg-gray-100 dark:bg-dark-800/50 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="text-gray-900 dark:text-white font-medium">OBS Settings:</span> Width: <span className="text-primary-600 dark:text-primary-400">250</span>, Height: <span className="text-primary-600 dark:text-primary-400">300</span>
                                </div>
                            </div>
                        )}

                        {/* Guide Tab */}
                        {activeTab === 'guide' && (
                            <div className="card">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    📖 Cara Menggunakan di OBS
                                </h2>
                                <ol className="space-y-3 text-gray-600 dark:text-gray-400">
                                    <li className="flex gap-3">
                                        <span className="w-6 h-6 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-sm font-medium shrink-0">
                                            1
                                        </span>
                                        <span>Buka OBS Studio, klik <strong className="text-gray-900 dark:text-white">+</strong> di bagian Sources</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="w-6 h-6 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-sm font-medium shrink-0">
                                            2
                                        </span>
                                        <span>Pilih <strong className="text-gray-900 dark:text-white">Browser</strong>, beri nama sesuai overlay yang ingin ditambahkan</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="w-6 h-6 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-sm font-medium shrink-0">
                                            3
                                        </span>
                                        <span>Copy URL overlay dari tab yang diinginkan dan paste ke field URL</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="w-6 h-6 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-sm font-medium shrink-0">
                                            4
                                        </span>
                                        <span>Set Width dan Height sesuai yang tertera di masing-masing widget</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="w-6 h-6 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-sm font-medium shrink-0">
                                            5
                                        </span>
                                        <span>Klik OK dan posisikan overlay sesuai keinginan</span>
                                    </li>
                                </ol>

                                {/* Widget Size Reference */}
                                <div className="mt-6 space-y-3">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Ukuran Widget yang Disarankan:</h3>
                                    <div className="grid gap-2">
                                        <div className="bg-gray-100 dark:bg-dark-800 rounded-lg p-3 flex justify-between items-center">
                                            <span className="text-gray-600 dark:text-gray-400 text-sm">🔔 Alert Box</span>
                                            <span className="text-primary-600 dark:text-primary-400 text-sm font-medium">500 x 300</span>
                                        </div>
                                        <div className="bg-gray-100 dark:bg-dark-800 rounded-lg p-3 flex justify-between items-center">
                                            <span className="text-gray-600 dark:text-gray-400 text-sm">📱 QR Code</span>
                                            <span className="text-primary-600 dark:text-primary-400 text-sm font-medium">250 x 300</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

