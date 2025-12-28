# Jajanin Backend

Backend API untuk platform donasi Jajanin, dibangun dengan Go dan Gin framework.

## Tech Stack

- **Framework**: Gin
- **Database**: PostgreSQL
- **ORM**: GORM
- **Authentication**: JWT + Google OAuth
- **Payment**: Midtrans

## Prerequisites

- Go 1.21+
- PostgreSQL 15+
- Midtrans Account (Sandbox untuk development)

## Setup

1. **Install Dependencies**
   ```bash
   go mod download
   ```

2. **Setup Environment**
   ```bash
   cp .env.example .env
   # Edit .env dengan konfigurasi Anda
   ```

3. **Setup Database**
   ```bash
   # Buat database PostgreSQL
   createdb jajanin_db
   ```

4. **Run Server**
   ```bash
   go run cmd/api/main.go
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user baru
- `POST /api/auth/login` - Login dan dapat JWT token
- `POST /api/auth/google` - OAuth dengan Google
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/:username` - Get public profile
- `PUT /api/users/profile` - Update profile (auth required)

### Donations
- `POST /api/donations` - Create donation
- `GET /api/donations` - Get creator's donations (auth required)
- `GET /api/donations/stats` - Get statistics (auth required)

### Payments
- `POST /api/payment/webhook` - Midtrans webhook

### Withdrawals
- `POST /api/withdrawals` - Request withdrawal (auth required)
- `GET /api/withdrawals` - Get withdrawal history (auth required)

## Project Structure

```
backend/
├── cmd/api/main.go          # Entry point
├── internal/
│   ├── config/              # Configuration
│   ├── database/            # Database connection
│   ├── handlers/            # HTTP handlers
│   ├── middleware/          # Middleware
│   ├── models/              # GORM models
│   ├── repository/          # Data access layer
│   ├── services/            # Business logic
│   └── utils/               # Utilities
├── pkg/midtrans/            # Midtrans client
├── .env.example
├── go.mod
└── README.md
```

## Environment Variables

See `.env.example` for required environment variables.
