'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';

interface GoogleAuthProviderProps {
    children: React.ReactNode;
}

export default function GoogleAuthProvider({ children }: GoogleAuthProviderProps) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

    if (!clientId) {
        console.warn('Google Client ID not configured');
        return <>{children}</>;
    }

    return (
        <GoogleOAuthProvider clientId={clientId}>
            {children}
        </GoogleOAuthProvider>
    );
}
