# Jajanin - Platform Donasi untuk Kreator Indonesia

Platform donasi yang memungkinkan content creator menerima dukungan finansial dari penggemar mereka. Terinspirasi dari Saweria, Trakteer, dan Ko-fi.

## 🚀 Tech Stack

### Backend
- **Go** dengan **Gin Framework**
- **PostgreSQL** + **GORM**
- **JWT** Authentication
- **Midtrans** Payment Gateway

### Frontend
- **Next.js 14** (App Router)
- **Tailwind CSS**
- **TypeScript**

## 📁 Project Structure

```
jajanin/
├── backend/                 # Go API Server
│   ├── cmd/api/main.go      # Entry point
│   ├── internal/
│   │   ├── config/          # Configuration
│   │   ├── database/        # Database connection
│   │   ├── handlers/        # HTTP handlers
│   │   ├── middleware/      # Middleware
│   │   ├── models/          # GORM models
│   │   ├── repository/      # Data access
│   │   └── services/        # Business logic
│   └── Dockerfile
│
├── frontend/                # Next.js App
│   ├── src/
│   │   ├── app/             # Pages
│   │   ├── components/      # React components
│   │   └── lib/             # Utilities
│   └── package.json
│
└── docker-compose.yml       # Docker setup
```

## 🛠️ Setup

### Prerequisites
- Go 1.21+
- Node.js 18+
- PostgreSQL 15+ (atau gunakan Docker)
- Midtrans Account

### Option 1: menggunakan Docker

```bash
# Clone the repo
cd jajanin

# Start all services
docker-compose up -d

# Backend: http://localhost:8080
# Frontend: http://localhost:3000
```

### Option 2: Manual Setup

#### 1. Setup Database
```bash
# Buat database PostgreSQL
createdb jajanin_db
```

#### 2. Setup Backend
```bash
cd backend

# Copy environment file
cp .env.example .env
# Edit .env dengan konfigurasi Anda

# Install dependencies & run
go mod download
go run cmd/api/main.go
```

#### 3. Setup Frontend
```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# Edit .env.local

# Run development server
npm run dev
```

## 🔐 Environment Variables

### Backend (.env)
```env
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=jajanin_db
JWT_SECRET=your_jwt_secret
MIDTRANS_SERVER_KEY=your_server_key
MIDTRANS_CLIENT_KEY=your_client_key
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your_client_key
```

## 📱 Features

### Untuk Creator
- ✅ Halaman donasi dengan link unik (jajanin.id/username)
- ✅ Dashboard dengan statistik lengkap
- ✅ Riwayat donasi
- ✅ Request withdrawal
- ✅ Customizable profile

### Untuk Supporter
- ✅ Donasi tanpa perlu login
- ✅ Multiple payment methods (QRIS, E-Wallet, Bank Transfer)
- ✅ Kirim pesan dukungan with donation

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/:username` - Get public profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/bank` - Update bank info

### Donations
- `POST /api/donations` - Create donation
- `GET /api/donations` - Get donations (auth)
- `GET /api/donations/stats` - Get stats (auth)
- `GET /api/donations/recent/:username` - Recent donations (public)

### Payments
- `POST /api/payment/webhook` - Midtrans webhook

### Withdrawals
- `POST /api/withdrawals` - Request withdrawal
- `GET /api/withdrawals` - Get history
- `GET /api/withdrawals/balance` - Get balance

## 🎨 Design

Platform menggunakan dark mode dengan warna utama Purple/Violet (`#7C3AED`). Design system lengkap tersedia di dokumentasi.

## 📄 License

MIT License
