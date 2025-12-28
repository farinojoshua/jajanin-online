import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import GoogleAuthProvider from '@/components/GoogleAuthProvider';

export const metadata: Metadata = {
    title: 'Jajanin - Dukung Kreator Favoritmu',
    description: 'Platform donasi untuk mendukung kreator favoritmu. Kirim dukungan dengan mudah dan aman.',
    keywords: ['donasi', 'kreator', 'support', 'tipping', 'indonesia'],
    authors: [{ name: 'Jajanin' }],
    openGraph: {
        title: 'Jajanin - Dukung Kreator Favoritmu',
        description: 'Platform donasi untuk mendukung kreator favoritmu',
        type: 'website',
        locale: 'id_ID',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="id" suppressHydrationWarning>
            <body>
                <ThemeProvider>
                    <GoogleAuthProvider>{children}</GoogleAuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}

