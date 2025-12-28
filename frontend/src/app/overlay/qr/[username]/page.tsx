'use client';

import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';

export default function QROverlayPage() {
    const params = useParams();
    const username = params.username as string;
    const [donationUrl, setDonationUrl] = useState('');

    useEffect(() => {
        setDonationUrl(`${window.location.origin}/${username}`);
    }, [username]);

    return (
        <div className="qr-overlay-container">
            <div className="qr-widget">
                <div className="qr-glow" />
                <div className="qr-content">
                    <div className="qr-header">
                        <span className="qr-icon">🧡</span>
                        <span className="qr-title">SUPPORT ME</span>
                    </div>

                    <div className="qr-code-wrapper">
                        <QRCodeSVG
                            value={donationUrl || `https://jajanin.com/${username}`}
                            size={150}
                            level="H"
                            includeMargin={false}
                            fgColor="#1a1a2e"
                            bgColor="#ffffff"
                        />
                    </div>

                    <div className="qr-footer">
                        <span className="qr-label">Scan untuk donasi</span>
                        <span className="qr-username">jajanin.com/{username}</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .qr-overlay-container {
                    width: 100vw;
                    height: 100vh;
                    display: flex;
                    align-items: flex-start;
                    justify-content: flex-end;
                    padding: 20px;
                    background: transparent;
                    font-family: 'Inter', system-ui, sans-serif;
                }

                .qr-widget {
                    position: relative;
                    background: linear-gradient(135deg, rgba(254, 98, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%);
                    border-radius: 20px;
                    padding: 20px;
                    box-shadow: 
                        0 0 30px rgba(254, 98, 68, 0.4),
                        0 10px 30px rgba(0, 0, 0, 0.3);
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    animation: floatIn 0.8s ease-out;
                }

                @keyframes floatIn {
                    0% {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.9);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .qr-glow {
                    position: absolute;
                    inset: -3px;
                    border-radius: 22px;
                    background: linear-gradient(135deg, #FF8A70, #FE6244, #E54D2E, #C73E22);
                    opacity: 0.6;
                    z-index: -1;
                    animation: glowPulse 3s ease-in-out infinite;
                }

                @keyframes glowPulse {
                    0%, 100% { opacity: 0.4; filter: blur(10px); }
                    50% { opacity: 0.7; filter: blur(15px); }
                }

                .qr-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                }

                .qr-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .qr-icon {
                    font-size: 20px;
                    animation: pulse 2s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }

                .qr-title {
                    font-size: 14px;
                    font-weight: 700;
                    color: white;
                    letter-spacing: 2px;
                    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                }

                .qr-code-wrapper {
                    background: white;
                    padding: 12px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                }

                .qr-footer {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2px;
                }

                .qr-label {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.8);
                }

                .qr-username {
                    font-size: 11px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.9);
                    background: rgba(0, 0, 0, 0.2);
                    padding: 4px 10px;
                    border-radius: 20px;
                }
            `}</style>
        </div>
    );
}
