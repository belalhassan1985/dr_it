# Pilot Launch Guide - DR.IT E-Commerce

## Local Development Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd app-DR-IT
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your values

# 3. Setup database
npx prisma migrate deploy
npx prisma generate

# 4. Create admin user
npm run seed:admin

# 5. Import products (first time)
npm run seed:anas

# 6. Start development
npm run dev
```

## Production Deployment

### Step 1: Environment Variables

Edit `.env` with production values:

```env
DATABASE_URL="postgresql://user:strongpassword@db-host:5432/dr_it?schema=public"
AUTH_SECRET="<generate-with-openssl-rand-base64-48>"
ADMIN_EMAIL="admin@dr-it.store"
ADMIN_PASSWORD="<strong-password>"
ADMIN_NAME="DR.IT Admin"
NEXT_PUBLIC_SITE_URL="https://dr-it.store"
```

Generate a secure AUTH_SECRET:
```bash
openssl rand -base64 48
```

### Step 2: Database Migration

```bash
npx prisma migrate deploy
npx prisma generate
```

### Step 3: Seed Admin

```bash
npm run seed:admin
```

### Step 4: Import Products

```bash
npm run sync:anas
```

### Step 5: Pre-Launch Check

```bash
npm run prelaunch
```

This runs: `prisma validate` → `eslint` → `next build`

### Step 6: Health Check

```bash
npm run healthcheck
```

Verify all checks pass before proceeding.

### Step 7: Build and Start

```bash
npm run build
npm start
```

### Step 8: Verify in Browser

1. Open `https://dr-it.store` — homepage loads
2. Browse products, categories, brands
3. Add product to cart from detail page
4. Complete checkout as guest
5. Register a customer account
6. Login and check account/orders
7. Login as admin at `/admin/login`
8. Check `/admin/health` — all green

## Ongoing Operations

### Daily Product Sync

Set up a cron job:
```bash
0 3 * * * cd /path/to/app-DR-IT && npm run sync:anas
```

### Database Backup

```bash
npm run db:backup
```

Creates: `backups/drit-backup-YYYY-MM-DD-HHmmss.sql`

### Scheduled Backups (cron)

```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/app-DR-IT && npm run db:backup
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma validate` | Validate Prisma schema |
| `npx prisma migrate deploy` | Run database migrations |
| `npx prisma generate` | Generate Prisma client |
| `npm run seed:admin` | Create/update admin user |
| `npm run seed:anas` | Import products from source |
| `npm run sync:anas` | Sync products (same as seed:anas) |
| `npm run db:backup` | Create database backup |
| `npm run healthcheck` | Check system health |
| `npm run prelaunch` | Full pre-launch validation |

## Pre-Delivery Checklist

- [ ] `AUTH_SECRET` is a strong random string (not default)
- [ ] `ADMIN_PASSWORD` is changed from default
- [ ] `NEXT_PUBLIC_SITE_URL` is set to real domain
- [ ] `DATABASE_URL` points to production database
- [ ] `npm run prelaunch` passes all checks
- [ ] `npm run healthcheck` passes all checks
- [ ] Admin user exists (`/admin/health`)
- [ ] Products are imported
- [ ] Categories and brands exist
- [ ] Daily sync cron is configured
- [ ] Database backup cron is configured
- [ ] HTTPS is enabled (reverse proxy)
- [ ] Firewall only exposes ports 80/443