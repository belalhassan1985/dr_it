import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function backup() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set");
    process.exitCode = 1;
    return;
  }

  const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    console.error("Could not parse DATABASE_URL");
    process.exitCode = 1;
    return;
  }

  const [, user, password, host, port, database] = match;
  const backupDir = path.join(process.cwd(), "backups");
  await mkdir(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `drit-backup-${timestamp}.sql`;
  const filepath = path.join(backupDir, filename);

  console.log(`Creating backup: ${filename}`);

  const env = { ...process.env, PGPASSWORD: password };
  const pgDump = process.platform === "win32" ? "pg_dump.exe" : "pg_dump";

  try {
    await execFileAsync(pgDump, [
      "-h", host,
      "-p", port,
      "-U", user,
      "-d", database,
      "--no-owner",
      "--no-privileges",
      "-f", filepath,
    ], { env });

    console.log(`Backup created successfully: ${filepath}`);
  } catch (error) {
    console.error("Backup failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

backup();