import { AdminShell } from "@/components/admin/admin-shell";
import { saveSettings } from "@/lib/admin-actions";
import { prisma } from "@/lib/db";

const fields = [
  ["site.name", "اسم الموقع"],
  ["site.description", "وصف الموقع"],
  ["tax.rate", "الضريبة"],
  ["company.phone", "الهاتف"],
  ["company.whatsapp", "واتساب"],
  ["company.email", "البريد الإلكتروني"],
  ["company.address", "العنوان"],
  ["store.status", "حالة المتجر"],
];

export default async function SettingsAdminPage() {
  const settings = await prisma.setting.findMany();
  const values = new Map(settings.map((setting) => [setting.key, setting.value]));

  return (
    <AdminShell title="Settings">
      <form action={saveSettings} className="admin-settings-form">
        {fields.map(([key, label]) => (
          <label key={key}>{label}<input name={key} defaultValue={values.get(key) ?? ""} /></label>
        ))}
        <button>حفظ الإعدادات</button>
      </form>
    </AdminShell>
  );
}
