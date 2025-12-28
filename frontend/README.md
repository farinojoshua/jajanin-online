# Jajanin Frontend

Frontend Next.js untuk platform donasi Jajanin.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **HTTP Client**: Axios

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local dengan konfigurasi Anda
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   ```
   http://localhost:3000
   ```

## Pages

- `/` - Landing page
- `/login` - Login page
- `/register` - Registration page
- `/[username]` - Creator donation page
- `/dashboard` - Creator dashboard
- `/dashboard/settings` - Settings page
- `/dashboard/donations` - Donations list
- `/dashboard/withdraw` - Withdrawal page

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Midtrans client key |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── [username]/page.tsx      # Creator page
│   │   ├── dashboard/
│   │   │   ├── page.tsx             # Dashboard
│   │   │   └── settings/page.tsx    # Settings
│   │   ├── login/page.tsx           # Login
│   │   ├── register/page.tsx        # Register
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Landing
│   │   └── globals.css              # Global styles
│   ├── components/
│   │   ├── DonationCard.tsx
│   │   ├── DonationForm.tsx
│   │   ├── Navbar.tsx
│   │   └── StatsCard.tsx
│   └── lib/
│       ├── api.ts                   # API client
│       ├── auth.ts                  # Auth utilities
│       └── utils.ts                 # General utilities
├── package.json
├── tailwind.config.js
└── next.config.js
```
