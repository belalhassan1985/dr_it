# DR.IT E-Commerce - Deployment Guide

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm or pnpm

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Random 64-char string for session signing |
| `ADMIN_EMAIL` | Yes | Admin account email |
| `ADMIN_PASSWORD` | Yes | Admin password (min 8 chars) |
| `ADMIN_NAME` | No | Admin display name (default: "DR.IT Admin") |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public site URL (e.g. https://dr-it.store) |
| `STORE_PHONE` | No | Store phone number |
| `STORE_WHATSAPP` | No | WhatsApp number |

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

```bash
npx prisma migrate deploy
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Create Admin User

```bash
npm run seed:admin
```

### 5. (Optional) Import Products

```bash
npm run seed:anas
```

### 6. Build Production

```bash
npm run build
```

### 7. Start Production Server

```bash
npm start
```

Default port: 3000. Set `PORT` env var to change.

## Production Checklist

- [ ] Change `AUTH_SECRET` to a strong random string
- [ ] Change `ADMIN_PASSWORD` from default
- [ ] Set `NEXT_PUBLIC_SITE_URL` to your domain
- [ ] Enable HTTPS (reverse proxy recommended)
- [ ] Set `NODE_ENV=production`
- [ ] Configure PostgreSQL with proper credentials
- [ ] Set up daily cron for product sync: `npm run sync:anas`
- [ ] Configure database backups: `npm run db:backup`
- [ ] Review firewall rules (only expose port 3000/443)

## Reverse Proxy (Nginx Example)

```nginx
server {
    listen 443 ssl http2;
    server_name dr-it.store;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Process Management (PM2)

```bash
npm install -g pm2
pm2 start npm --name "dr-it" -- start
pm2 save
pm2 startup
```