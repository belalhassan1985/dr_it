# Database Backup Guide

## Manual Backup

```bash
npm run db:backup
```

This creates a SQL dump file in `backups/` with the format:
```
backups/drit-backup-YYYY-MM-DD-HHmmss.sql
```

## Restore from Backup

```bash
psql -U postgres -d dr_it -f backups/drit-backup-YYYY-MM-DD-HHmmss.sql
```

## Automated Daily Backups (Linux Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/app-DR-IT && npm run db:backup
```

## Automated Daily Backups (Windows Task Scheduler)

```powershell
# Create a scheduled task
schtasks /create /tn "DR.IT DB Backup" /tr "npm run db:backup" /sc daily /st 02:00 /f
```

## Backup Retention

- Keep at least 7 days of backups
- Manual cleanup: delete old files from `backups/` directory
- Recommended: archive monthly backups to external storage

## Cloud Backup (Optional)

For production, consider uploading backups to cloud storage:

```bash
# AWS S3 example
aws s3 cp backups/drit-backup-latest.sql s3://your-bucket/db-backups/

# Or use rclone for any cloud provider
rclone copy backups/ remote:your-bucket/db-backups/
```