// Alert Settings Types and API

export interface AlertSettings {
    // Visual Settings
    theme: 'default' | 'custom';
    background_color: string;  // hex color
    text_color: string;        // hex color
    accent_color: string;      // hex color for amount
    font_family: string;       // font name
    font_size: 'small' | 'medium' | 'large';

    // Animation Settings
    animation: 'slide' | 'fade' | 'bounce' | 'pop' | 'zoom';
    duration: number;          // seconds (3-10)

    // Audio Settings
    sound_enabled: boolean;
    sound_file: string;        // 'default', 'coin', 'bell', 'chime'
    sound_volume: number;      // 0-100
}

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
    theme: 'default',
    background_color: '#FE6244',
    text_color: '#FFFFFF',
    accent_color: '#FBBF24',
    font_family: 'inter',
    font_size: 'medium',
    animation: 'slide',
    duration: 5,
    sound_enabled: false,
    sound_file: 'default',
    sound_volume: 50,
};

export const FONT_OPTIONS = [
    { value: 'inter', label: 'Inter' },
    { value: 'poppins', label: 'Poppins' },
    { value: 'roboto', label: 'Roboto' },
    { value: 'montserrat', label: 'Montserrat' },
    { value: 'comic-sans', label: 'Comic Sans' },
];

export const ANIMATION_OPTIONS = [
    { value: 'slide', label: 'Slide Down' },
    { value: 'fade', label: 'Fade In' },
    { value: 'bounce', label: 'Bounce' },
    { value: 'pop', label: 'Pop' },
    { value: 'zoom', label: 'Zoom' },
];

export const SOUND_OPTIONS = [
    { value: 'default', label: 'Default' },
    { value: 'coin', label: 'Coin' },
    { value: 'bell', label: 'Bell' },
    { value: 'chime', label: 'Chime' },
];

export const THEME_PRESETS = [
    { name: 'Default (Orange)', bg: '#FE6244', text: '#FFFFFF', accent: '#FBBF24' },
    { name: 'Purple', bg: '#8B5CF6', text: '#FFFFFF', accent: '#FBBF24' },
    { name: 'Green', bg: '#10B981', text: '#FFFFFF', accent: '#FEF08A' },
    { name: 'Blue', bg: '#3B82F6', text: '#FFFFFF', accent: '#FDE68A' },
    { name: 'Pink', bg: '#EC4899', text: '#FFFFFF', accent: '#FEF9C3' },
    { name: 'Dark', bg: '#1F2937', text: '#F9FAFB', accent: '#FBBF24' },
];
