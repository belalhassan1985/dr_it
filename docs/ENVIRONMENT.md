# Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | - | HMAC-SHA256 key for session cookies (64+ chars recommended) |
| `ADMIN_EMAIL` | Yes | - | Admin account email (must be unique) |
| `ADMIN_PASSWORD` | Yes | - | Admin password (min 8 chars, used by `npm run seed:admin`) |
| `ADMIN_NAME` | No | "DR.IT Admin" | Admin display name |
| `NEXT_PUBLIC_SITE_URL` | Yes | "https://dr-it.store" | Public site URL for SEO (sitemap, OpenGraph) |
| `STORE_PHONE` | No | - | Store phone number (displayed in footer/settings) |
| `STORE_WHATSAPP` | No | - | WhatsApp contact number |
| `NODE_ENV` | No | "development" | Set to "production" for deployment |
| `PORT` | No | 3000 | Server listening port |
| `ANAS_IMPORT_PAGES` | No | - | Pages to import from source (comma-separated) |
| `ANAS_IMPORT_LIMIT` | No | - | Max products to import per sync run |

## Security Notes

- **Never commit `.env` to version control** - it's in `.gitignore`
- **Change `AUTH_SECRET`** from the default value before production
- **Use strong passwords** for admin accounts (min 8 chars)
- **Rotate `AUTH_SECRET`** will invalidate all existing sessions
- **`NEXT_PUBLIC_SITE_URL`** is exposed to the client - use your real domain