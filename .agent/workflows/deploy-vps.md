---
description: Deploy Jajanin ke VPS CentOS dengan Podman (non-root user)
---

# Deploy Jajanin ke VPS CentOS

## Prerequisites
- VPS CentOS dengan Podman terinstall
- Domain jajanin.online sudah pointing ke IP VPS (103.87.169.49)
- User biasa dengan akses sudo

---

## 1. Login ke VPS

```bash
ssh username@103.87.169.49
```

---

## 2. Upload Project

**Option A: Via Git**
```bash
cd ~
git clone https://github.com/yourusername/jajanin.git
cd jajanin
```

**Option B: Via SCP (dari local PC)**
```bash
# Jalankan di local PC
scp -r ./Jajanin username@103.87.169.49:~/jajanin
```

---

## 3. Setup Environment Variables

```bash
cd ~/jajanin
cp .env.production.example .env
```

Edit file `.env`:
```bash
vi .env
```

Isi dengan nilai production:
```env
# Database
DB_USER=postgres
DB_PASSWORD=GantiDenganPasswordKuat123!
DB_NAME=jajanin_db

# JWT (generate: openssl rand -base64 64)
JWT_SECRET=paste_hasil_generate_disini

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Paylabs
PAYLABS_MERCHANT_ID=your_merchant_id
PAYLABS_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----
isi_private_key_disini
-----END RSA PRIVATE KEY-----
PAYLABS_API_URL=https://api.paylabs.co.id

# URLs
FRONTEND_URL=https://jajanin.online
APP_URL=https://jajanin.online
NEXT_PUBLIC_API_URL=https://jajanin.online
```

---

## 4. Setup SSL Certificate

```bash
# Install certbot jika belum
sudo dnf install certbot -y

# Stop service yang pakai port 80 sementara
# Generate certificate
sudo certbot certonly --standalone -d jajanin.online -d www.jajanin.online

# Copy certificates ke project
mkdir -p ~/jajanin/nginx/certs
sudo cp /etc/letsencrypt/live/jajanin.online/fullchain.pem ~/jajanin/nginx/certs/
sudo cp /etc/letsencrypt/live/jajanin.online/privkey.pem ~/jajanin/nginx/certs/
sudo chown $USER:$USER ~/jajanin/nginx/certs/*.pem
```

---

## 5. Firewall

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 6. Deploy dengan Podman

```bash
cd ~/jajanin

# Build dan jalankan semua services
podman-compose -f docker-compose.prod.yml up -d --build

# Cek status containers
podman ps

# Lihat logs (optional)
podman-compose -f docker-compose.prod.yml logs -f
```

---

## 7. Verifikasi

```bash
# Test health endpoint
curl https://jajanin.online/health

# Atau buka di browser
# https://jajanin.online
```

---

## 8. Setup Auto-Start (Systemd User Service)

```bash
# Buat direktori systemd user
mkdir -p ~/.config/systemd/user

# Buat service file
cat > ~/.config/systemd/user/jajanin.service << 'EOF'
[Unit]
Description=Jajanin Application
After=network.target

[Service]
Type=simple
WorkingDirectory=%h/jajanin
ExecStart=/usr/bin/podman-compose -f docker-compose.prod.yml up
ExecStop=/usr/bin/podman-compose -f docker-compose.prod.yml down
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
EOF

# Enable lingering (agar service jalan walau user logout)
sudo loginctl enable-linger $USER

# Enable dan start service
systemctl --user daemon-reload
systemctl --user enable jajanin
systemctl --user start jajanin

# Cek status
systemctl --user status jajanin
```

---

## 9. Setup SSL Auto-Renewal

```bash
# Tambah ke crontab
crontab -e

# Tambahkan baris ini:
0 0 1 * * sudo certbot renew --quiet && sudo cp /etc/letsencrypt/live/jajanin.online/*.pem ~/jajanin/nginx/certs/ && podman restart jajanin-nginx
```

---

## Troubleshooting

### Cek logs container
```bash
podman logs jajanin-backend
podman logs jajanin-frontend
podman logs jajanin-nginx
podman logs jajanin-db
```

### Restart semua services
```bash
cd ~/jajanin
podman-compose -f docker-compose.prod.yml down
podman-compose -f docker-compose.prod.yml up -d
```

### SELinux issues
```bash
sudo setsebool -P container_manage_cgroup on
```

### Database connection issues
```bash
# Masuk ke container db
podman exec -it jajanin-db psql -U postgres -d jajanin_db
```
