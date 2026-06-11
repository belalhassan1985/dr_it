import { prisma } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { SettingsPageClient } from "@/components/admin/settings-page";

export default async function SettingsAdminPage() {
  const [settingsRows, accounts] = await Promise.all([
    prisma.setting.findMany(),
    prisma.paymentAccount.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  const settings = new Map(settingsRows.map((s) => [s.key, s.value]));

  return (
    <AdminShell title="Settings">
      <SettingsPageClient settings={settings} accounts={accounts} />
    </AdminShell>
  );
}
