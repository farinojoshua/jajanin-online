'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { getTTSService } from '@/lib/tts';
import { AlertSettings, DEFAULT_ALERT_SETTINGS } from '@/lib/alertSettings';
import { userApi } from '@/lib/api';

interface AlertData {
    supporter_name: string;
    amount: number;
    message: string;
    creator_name: string;
    product_name?: string;
    product_emoji?: string;
    quantity?: number;
}

// Font mapping
const FONT_MAP: Record<string, string> = {
    'inter': "'Inter', system-ui, sans-serif",
    'poppins': "'Poppins', sans-serif",
    'roboto': "'Roboto', sans-serif",
    'montserrat': "'Montserrat', sans-serif",
    'comic-sans': "'Comic Sans MS', cursive",
};

// Font size mapping
const FONT_SIZE_MAP: Record<string, { supporter: string; amount: string; message: string }> = {
    'small': { supporter: '18px', amount: '22px', message: '14px' },
    'medium': { supporter: '22px', amount: '28px', message: '16px' },
    'large': { supporter: '26px', amount: '34px', message: '18px' },
};

// Format jajan text: "☕ Jajanin 3 Kopi" atau just amount if no product
const formatJajanText = (alert: AlertData) => {
    if (alert.product_name) {
        const emoji = alert.product_emoji || '🍽️';
        const qty = alert.quantity || 1;
        return `${emoji} Jajanin ${qty} ${alert.product_name}`;
    }
    // Fallback to amount if no product
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(alert.amount);
};

export default function AlertOverlayPage() {
    const params = useParams();
    const streamKey = params.streamKey as string;
    const [currentAlert, setCurrentAlert] = useState<AlertData | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const [settings, setSettings] = useState<AlertSettings>(DEFAULT_ALERT_SETTINGS);
    const [ttsEnabled, setTtsEnabled] = useState(false);
    const [audioActivated, setAudioActivated] = useState(false);
    const ttsRef = useRef(getTTSService());
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Load TTS enabled state from localStorage settings
    useEffect(() => {
        const ttsSettings = ttsRef.current.getSettings();
        setTtsEnabled(ttsSettings.enabled);
    }, []);

    // Activate audio (required due to browser autoplay policy)
    const handleActivateAudio = () => {
        // Try to speak silently to unlock TTS
        ttsRef.current.speak(' ').catch(() => {});
        setAudioActivated(true);
    };

    // Load user's alert settings
    useEffect(() => {
        if (!streamKey) return;

        const loadSettings = async () => {
            try {
                const res = await userApi.getAlertSettingsByStreamKey(streamKey);
                if (res.data.data) {
                    setSettings(res.data.data);
                }
            } catch (err) {
                console.error('Failed to load alert settings:', err);
            }
        };

        loadSettings();
    }, [streamKey]);

    const playSound = useCallback(() => {
        if (!settings.sound_enabled) return;

        try {
            const audio = new Audio(`/sounds/${settings.sound_file}.mp3`);
            audio.volume = settings.sound_volume / 100;
            audio.play().catch(e => console.log('Sound play failed:', e));
            audioRef.current = audio;
        } catch (err) {
            console.error('Failed to play sound:', err);
        }
    }, [settings.sound_enabled, settings.sound_file, settings.sound_volume]);

    const showAlert = useCallback((alert: AlertData) => {
        setCurrentAlert(alert);
        setIsVisible(true);

        // Play sound effect
        playSound();

        // Speak the donation using TTS (only if enabled and audio activated)
        if (ttsEnabled && audioActivated) {
            let speakText = alert.product_name
                ? `${alert.supporter_name} Jajanin ${alert.quantity || 1} ${alert.product_name}`
                : `${alert.supporter_name} memberi ${new Intl.NumberFormat('id-ID').format(alert.amount)} rupiah`;

            if (alert.message) {
                speakText += `. Pesannya: ${alert.message}`;
            }

            ttsRef.current.speak(speakText).catch(() => {});
        }

        // Hide after duration (from settings)
        setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => {
                setCurrentAlert(null);
            }, 500); // Wait for fade-out animation
        }, settings.duration * 1000);
    }, [settings.duration, playSound, ttsEnabled, audioActivated]);

    useEffect(() => {
        if (!streamKey) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const eventSource = new EventSource(`${apiUrl}/overlay/alert/${streamKey}`);

        eventSource.onopen = () => {
            setConnectionStatus('connected');
        };

        eventSource.addEventListener('connected', () => {
            // Connection confirmed
        });

        eventSource.addEventListener('alert', (event) => {
            try {
                const alert: AlertData = JSON.parse(event.data);
                showAlert(alert);
            } catch {
                // Failed to parse alert - ignore
            }
        });

        eventSource.onerror = () => {
            setConnectionStatus('disconnected');

            // Auto-reconnect after 3 seconds
            setTimeout(() => {
                setConnectionStatus('connecting');
            }, 3000);
        };

        return () => {
            eventSource.close();
        };
    }, [streamKey, showAlert]);

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="overlay-container">
            {/* Audio activation button (required due to browser autoplay policy) */}
            {ttsEnabled && !audioActivated && (
                <button
                    onClick={handleActivateAudio}
                    className="activate-audio-btn"
                >
                    🔊 Klik untuk Aktifkan TTS
                </button>
            )}

            {/* Connection indicator (hidden in OBS, visible for debugging) */}
            <div className={`connection-indicator ${connectionStatus}`}>
                {connectionStatus === 'connecting' && '🔄 Connecting...'}
                {connectionStatus === 'connected' && (
                    ttsEnabled
                        ? (audioActivated ? '🟢 Connected (TTS Ready)' : '🟢 Connected (Klik untuk TTS)')
                        : '🟢 Connected'
                )}
                {connectionStatus === 'disconnected' && '🔴 Disconnected'}
            </div>

            {/* Alert Box */}
            {currentAlert && (
                <div
                    className={`alert-box ${isVisible ? 'alert-show' : 'alert-hide'} animation-${settings.animation}`}
                    style={{
                        background: settings.background_color,
                        fontFamily: FONT_MAP[settings.font_family] || FONT_MAP['inter'],
                    }}
                >
                    <div
                        className="alert-glow"
                        style={{ background: settings.background_color }}
                    />
                    <div className="alert-content">
                        <div className="alert-icon" style={{ color: settings.accent_color }}>
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
                            </svg>
                        </div>
                        <div className="alert-header">
                            <span
                                className="alert-jajan-text"
                                style={{
                                    color: settings.accent_color,
                                    fontSize: FONT_SIZE_MAP[settings.font_size]?.amount || '28px',
                                }}
                            >
                                {formatJajanText(currentAlert)}
                            </span>
                            <span
                                className="alert-from"
                                style={{
                                    color: settings.text_color,
                                    fontSize: FONT_SIZE_MAP[settings.font_size]?.supporter || '22px',
                                }}
                            >
                                dari {currentAlert.supporter_name}
                            </span>
                        </div>
                        {currentAlert.message && (
                            <div
                                className="alert-message"
                                style={{
                                    color: settings.text_color,
                                    fontSize: FONT_SIZE_MAP[settings.font_size]?.message || '16px',
                                }}
                            >
                                "{currentAlert.message}"
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .overlay-container {
                    width: 100vw;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding-top: 40px;
                    background: transparent;
                    font-family: 'Inter', system-ui, sans-serif;
                }

                .activate-audio-btn {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    padding: 16px 32px;
                    font-size: 16px;
                    font-weight: 600;
                    color: white;
                    background: linear-gradient(135deg, #FE6244, #E54D2E);
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    box-shadow: 0 4px 20px rgba(254, 98, 68, 0.4);
                    transition: all 0.3s;
                    z-index: 9999;
                }

                .activate-audio-btn:hover {
                    transform: translate(-50%, -50%) scale(1.05);
                    box-shadow: 0 6px 30px rgba(254, 98, 68, 0.6);
                }

                .connection-indicator {
                    position: fixed;
                    bottom: 10px;
                    left: 10px;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    opacity: 0.3;
                    transition: opacity 0.3s;
                }

                .connection-indicator:hover {
                    opacity: 1;
                }

                .connection-indicator.connecting {
                    background: rgba(255, 193, 7, 0.2);
                    color: #ffc107;
                }

                .connection-indicator.connected {
                    background: rgba(40, 167, 69, 0.2);
                    color: #28a745;
                }

                .connection-indicator.disconnected {
                    background: rgba(220, 53, 69, 0.2);
                    color: #dc3545;
                }

                .alert-box {
                    position: relative;
                    background: linear-gradient(135deg, rgba(254, 98, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%);
                    border-radius: 16px;
                    padding: 24px 32px;
                    min-width: 350px;
                    max-width: 450px;
                    box-shadow: 
                        0 0 30px rgba(254, 98, 68, 0.5),
                        0 0 60px rgba(254, 98, 68, 0.3),
                        0 20px 40px rgba(0, 0, 0, 0.3);
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    transform-origin: top center;
                }

                .alert-show {
                    animation: alertSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }

                .alert-hide {
                    animation: alertSlideOut 0.5s ease-in forwards;
                }

                @keyframes alertSlideIn {
                    0% {
                        opacity: 0;
                        transform: translateY(-50px) scale(0.8);
                    }
                    50% {
                        transform: translateY(10px) scale(1.02);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes alertSlideOut {
                    0% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-30px) scale(0.9);
                    }
                }

                /* Animation variants */
                .animation-slide.alert-show { animation-name: alertSlideIn; }
                .animation-fade.alert-show { animation-name: alertFadeIn; }
                .animation-bounce.alert-show { animation-name: alertBounceIn; }
                .animation-pop.alert-show { animation-name: alertPopIn; }
                .animation-zoom.alert-show { animation-name: alertZoomIn; }

                @keyframes alertFadeIn {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }

                @keyframes alertBounceIn {
                    0% { opacity: 0; transform: scale(0.3); }
                    50% { transform: scale(1.1); }
                    70% { transform: scale(0.9); }
                    100% { opacity: 1; transform: scale(1); }
                }

                @keyframes alertPopIn {
                    0% { opacity: 0; transform: scale(0); }
                    80% { transform: scale(1.1); }
                    100% { opacity: 1; transform: scale(1); }
                }

                @keyframes alertZoomIn {
                    0% { opacity: 0; transform: scale(0.5); }
                    100% { opacity: 1; transform: scale(1); }
                }

                .alert-glow {
                    position: absolute;
                    inset: -2px;
                    border-radius: 18px;
                    background: linear-gradient(135deg, #FF8A70, #FE6244, #E54D2E, #C73E22);
                    opacity: 0.7;
                    z-index: -1;
                    animation: glowPulse 2s ease-in-out infinite;
                }

                @keyframes glowPulse {
                    0%, 100% {
                        opacity: 0.5;
                        filter: blur(8px);
                    }
                    50% {
                        opacity: 0.8;
                        filter: blur(12px);
                    }
                }

                .alert-content {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                }

                .alert-icon {
                    width: 48px;
                    height: 48px;
                    color: #fbbf24;
                    filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.5));
                    animation: starSpin 1s ease-out;
                }

                @keyframes starSpin {
                    0% {
                        transform: rotate(-180deg) scale(0);
                        opacity: 0;
                    }
                    50% {
                        transform: rotate(20deg) scale(1.2);
                    }
                    100% {
                        transform: rotate(0deg) scale(1);
                        opacity: 1;
                    }
                }

                .alert-header {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                }

                .alert-jajan-text {
                    font-size: 28px;
                    font-weight: 800;
                    color: #fbbf24;
                    text-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
                    animation: amountPop 0.5s ease-out 0.2s both;
                }

                .alert-from {
                    font-size: 22px;
                    font-weight: 700;
                    color: white;
                    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                }

                @keyframes amountPop {
                    0% {
                        transform: scale(0);
                    }
                    50% {
                        transform: scale(1.2);
                    }
                    100% {
                        transform: scale(1);
                    }
                }

                .alert-message {
                    font-size: 16px;
                    color: rgba(255, 255, 255, 0.9);
                    text-align: center;
                    font-style: italic;
                    padding: 8px 16px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                    max-width: 100%;
                    word-wrap: break-word;
                    animation: messageFadeIn 0.5s ease-out 0.3s both;
                }

                @keyframes messageFadeIn {
                    0% {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
