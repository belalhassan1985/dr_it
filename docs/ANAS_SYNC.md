# DR.IT ANAS Product Sync

This project uses `anas-iq.com` only as a product data source during development. The public storefront and admin identity remain DR.IT.

## Command

Run a manual sync:

```powershell
npm run sync:anas
```

The command is idempotent:

- Existing products are updated by `sku` or `sourceProductId`.
- New products are inserted.
- New images are downloaded to `public/products`.
- Existing local image files are reused.
- Missing products are not deleted.
- A sync report is saved in the `SyncRun` table.

## Environment

Set these values in `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/dr_it?schema=public"
ANAS_IMPORT_PAGES="1,2,3"
ANAS_IMPORT_LIMIT=""
```

Increase `ANAS_IMPORT_PAGES` when you want to sync more pages from the source API.

## Windows Task Scheduler

1. Open **Task Scheduler**.
2. Choose **Create Basic Task**.
3. Name it `DR.IT ANAS Sync`.
4. Trigger: **Daily**.
5. Start time: `2:00:00 AM`.
6. Action: **Start a program**.
7. Program/script:

```text
npm.cmd
```

8. Add arguments:

```text
run sync:anas
```

9. Start in:

```text
C:\Users\belal\Desktop\عمل\app-DR-IT
```

10. Save the task.

For reliability, open the task properties and enable:

- Run whether user is logged on or not.
- Stop the task if it runs longer than 1 hour.
- If the task fails, restart every 10 minutes up to 3 times.

## Cron

On Linux/macOS, add:

```cron
0 2 * * * cd /path/to/app-DR-IT && npm run sync:anas >> logs/anas-sync.log 2>&1
```

Create the `logs` directory first if you use this example:

```bash
mkdir -p logs
```

## Verification

After a sync, check:

```powershell
npx prisma validate
npm run lint
npm run build
```

The latest sync reports are stored in the `SyncRun` table and will be used by the future `/admin/sync` page.
