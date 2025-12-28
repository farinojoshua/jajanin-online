'use client';

import { useRef, useState } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Download, Copy, Check, Palette } from 'lucide-react';

interface QRCodeGeneratorProps {
    url: string;
    username: string;
}

const colorPresets = [
    { name: 'Default', fg: '#1a1a2e', bg: '#ffffff' },
    { name: 'Purple', fg: '#7c3aed', bg: '#ffffff' },
    { name: 'Orange', fg: '#ea580c', bg: '#ffffff' },
    { name: 'Dark', fg: '#ffffff', bg: '#1a1a2e' },
    { name: 'Pink', fg: '#ec4899', bg: '#ffffff' },
    { name: 'Green', fg: '#059669', bg: '#ffffff' },
];

export default function QRCodeGenerator({ url, username }: QRCodeGeneratorProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);
    const [qrSize, setQrSize] = useState(200);
    const [selectedColor, setSelectedColor] = useState(colorPresets[0]);
    const [showColorPicker, setShowColorPicker] = useState(false);

    const downloadQRCode = (format: 'png' | 'svg') => {
        if (format === 'png') {
            const canvas = canvasRef.current?.querySelector('canvas');
            if (canvas) {
                const link = document.createElement('a');
                link.download = `qrcode-${username}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
        } else {
            const svg = canvasRef.current?.querySelector('svg');
            if (svg) {
                const svgData = new XMLSerializer().serializeToString(svg);
                const blob = new Blob([svgData], { type: 'image/svg+xml' });
                const link = document.createElement('a');
                link.download = `qrcode-${username}.svg`;
                link.href = URL.createObjectURL(blob);
                link.click();
                URL.revokeObjectURL(link.href);
            }
        }
    };

    const copyQRCode = async () => {
        const canvas = canvasRef.current?.querySelector('canvas');
        if (canvas) {
            canvas.toBlob(async (blob) => {
                if (blob) {
                    try {
                        await navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blob })
                        ]);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                    } catch (err) {
                        console.error('Failed to copy QR code:', err);
                    }
                }
            }, 'image/png');
        }
    };

    return (
        <div className="space-y-4">
            {/* QR Code Preview */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* QR Display */}
                <div className="flex flex-col items-center gap-4">
                    <div
                        ref={canvasRef}
                        className="p-4 rounded-xl border-2 border-gray-200 dark:border-dark-700"
                        style={{ backgroundColor: selectedColor.bg }}
                    >
                        {/* Hidden canvas for download */}
                        <div style={{ display: 'none' }}>
                            <QRCodeCanvas
                                value={url}
                                size={qrSize}
                                level="H"
                                includeMargin={true}
                                fgColor={selectedColor.fg}
                                bgColor={selectedColor.bg}
                            />
                        </div>
                        {/* Visible SVG */}
                        <QRCodeSVG
                            value={url}
                            size={qrSize}
                            level="H"
                            includeMargin={false}
                            fgColor={selectedColor.fg}
                            bgColor={selectedColor.bg}
                        />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        {url}
                    </p>
                </div>

                {/* Controls */}
                <div className="flex-1 space-y-4">
                    {/* Size Slider */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Ukuran: {qrSize}px
                        </label>
                        <input
                            type="range"
                            min="100"
                            max="400"
                            step="20"
                            value={qrSize}
                            onChange={(e) => setQrSize(Number(e.target.value))}
                            className="w-full accent-primary-500"
                        />
                    </div>

                    {/* Color Presets */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            <div className="flex items-center gap-2">
                                <Palette className="w-4 h-4" />
                                Warna
                            </div>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {colorPresets.map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => setSelectedColor(preset)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition ${selectedColor.name === preset.name
                                            ? 'border-primary-500 bg-primary-500/10'
                                            : 'border-gray-200 dark:border-dark-700 hover:border-primary-500/50'
                                        }`}
                                >
                                    <div
                                        className="w-5 h-5 rounded border border-gray-300"
                                        style={{
                                            backgroundColor: preset.bg,
                                            boxShadow: `inset 0 0 0 2px ${preset.fg}`
                                        }}
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {preset.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Download Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2">
                        <button
                            onClick={() => downloadQRCode('png')}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download PNG
                        </button>
                        <button
                            onClick={() => downloadQRCode('svg')}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download SVG
                        </button>
                        <button
                            onClick={copyQRCode}
                            className="btn-secondary flex items-center gap-2"
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-green-500" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                            {copied ? 'Tersalin!' : 'Copy'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
