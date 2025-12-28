/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    400: '#FF8A70',
                    500: '#FE6244',
                    600: '#E54D2E',
                    700: '#C73E22',
                },
                dark: {
                    950: '#0A0A0F',
                    900: '#111118',
                    800: '#1F1F28',
                    700: '#2D2D3A',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
