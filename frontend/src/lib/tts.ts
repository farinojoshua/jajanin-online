'use client';

export interface TTSSettings {
    enabled: boolean;
    voiceName: string;
    rate: number;      // 0.5 - 2.0
    volume: number;    // 0.0 - 1.0
    speakAmount: boolean;
    speakMessage: boolean;
}

const DEFAULT_SETTINGS: TTSSettings = {
    enabled: true,
    voiceName: '',
    rate: 1.0,
    volume: 1.0,
    speakAmount: true,
    speakMessage: true,
};

const STORAGE_KEY = 'jajanin_tts_settings';

class TTSService {
    private synth: SpeechSynthesis | null = null;
    private voices: SpeechSynthesisVoice[] = [];
    private settings: TTSSettings = DEFAULT_SETTINGS;
    private initialized = false;

    constructor() {
        if (typeof window !== 'undefined') {
            this.synth = window.speechSynthesis;
            this.loadSettings();
            this.loadVoices();
        }
    }

    private loadVoices(): void {
        if (!this.synth) return;

        // Voices may not be immediately available
        const loadVoicesHandler = () => {
            this.voices = this.synth!.getVoices();
            // Prefer Indonesian or English voices
            if (!this.settings.voiceName && this.voices.length > 0) {
                const idVoice = this.voices.find(v => v.lang.startsWith('id'));
                const enVoice = this.voices.find(v => v.lang.startsWith('en'));
                this.settings.voiceName = idVoice?.name || enVoice?.name || this.voices[0].name;
            }
            this.initialized = true;
        };

        // Some browsers load voices asynchronously
        if (this.synth.getVoices().length > 0) {
            loadVoicesHandler();
        } else {
            this.synth.addEventListener('voiceschanged', loadVoicesHandler);
        }
    }

    private loadSettings(): void {
        if (typeof window === 'undefined') return;

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            }
        } catch {
            console.warn('Failed to load TTS settings');
        }
    }

    public saveSettings(settings: Partial<TTSSettings>): void {
        this.settings = { ...this.settings, ...settings };
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
        }
    }

    public getSettings(): TTSSettings {
        return { ...this.settings };
    }

    public getVoices(): SpeechSynthesisVoice[] {
        return this.voices;
    }

    public isInitialized(): boolean {
        return this.initialized;
    }

    public speak(text: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.synth || !this.settings.enabled) {
                resolve();
                return;
            }

            // Cancel any ongoing speech
            this.synth.cancel();

            const utterance = new SpeechSynthesisUtterance(text);

            // Find the selected voice
            const selectedVoice = this.voices.find(v => v.name === this.settings.voiceName);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            utterance.rate = this.settings.rate;
            utterance.volume = this.settings.volume;

            utterance.onend = () => resolve();
            utterance.onerror = (event) => {
                console.error('TTS Error:', event.error);
                reject(event.error);
            };

            this.synth.speak(utterance);
        });
    }

    public async speakDonation(
        supporterName: string,
        amount: number,
        message?: string
    ): Promise<void> {
        if (!this.settings.enabled) return;

        const formattedAmount = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);

        const parts: string[] = [];

        if (this.settings.speakAmount) {
            parts.push(`${supporterName} mendonasikan ${formattedAmount}`);
        }

        if (this.settings.speakMessage && message && message.trim()) {
            parts.push(message);
        }

        for (const part of parts) {
            await this.speak(part);
            // Small pause between parts
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    public stop(): void {
        if (this.synth) {
            this.synth.cancel();
        }
    }

    public testSpeak(): void {
        this.speak('Ini adalah test Text to Speech dari Jajanin');
    }
}

// Singleton instance
let ttsInstance: TTSService | null = null;

export function getTTSService(): TTSService {
    if (!ttsInstance) {
        ttsInstance = new TTSService();
    }
    return ttsInstance;
}

export default TTSService;
