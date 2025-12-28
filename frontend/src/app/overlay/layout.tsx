'use client';

export default function OverlayLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="overlay-root">
            {children}
            <style jsx global>{`
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                html, body {
                    background: transparent !important;
                    overflow: hidden;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                }
                .overlay-root {
                    background: transparent;
                }
            `}</style>
        </div>
    );
}
