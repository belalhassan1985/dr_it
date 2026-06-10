import { AdminShell } from "@/components/admin/admin-shell";
import { prisma } from "@/lib/db";

export default async function HealthAdminPage() {
  const [
    productCount,
    categoryCount,
    brandCount,
    orderCount,
    adminCount,
    customerCount,
    lastSync,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.brand.count(),
    prisma.order.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.syncRun.findFirst({ orderBy: { startedAt: "desc" } }),
  ]);

  const authSecretConfigured =
    typeof process.env.AUTH_SECRET === "string" &&
    process.env.AUTH_SECRET !== "change-me-dr-it-auth-secret" &&
    process.env.AUTH_SECRET.length >= 32;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "غير محدد";

  return (
    <AdminShell title="System Health">
      <div className="admin-stat-grid">
        <HealthCard label="قاعدة البيانات" value="متصلة" status="ok" />
        <HealthCard label="المنتجات" value={String(productCount)} status={productCount > 0 ? "ok" : "warn"} />
        <HealthCard label="الأقسام" value={String(categoryCount)} status={categoryCount > 0 ? "ok" : "warn"} />
        <HealthCard label="العلامات التجارية" value={String(brandCount)} status={brandCount > 0 ? "ok" : "warn"} />
        <HealthCard label="الطلبات" value={String(orderCount)} status="ok" />
        <HealthCard label="المدراء" value={String(adminCount)} status={adminCount > 0 ? "ok" : "fail"} />
        <HealthCard label="العملاء" value={String(customerCount)} status="ok" />
        <HealthCard label="AUTH_SECRET" value={authSecretConfigured ? "مُعدّ" : "افتراضي!"} status={authSecretConfigured ? "ok" : "fail"} />
        <HealthCard label="SITE_URL" value={siteUrl} status="ok" />
        <HealthCard label="آخر Sync" value={lastSync ? lastSync.status : "لا يوجد"} status={lastSync ? (lastSync.status === "completed" ? "ok" : "warn") : "warn"} />
      </div>
    </AdminShell>
  );
}

function HealthCard({ label, value, status }: { label: string; value: string; status: "ok" | "warn" | "fail" }) {
  const colors: Record<string, string> = {
    ok: "var(--success)",
    warn: "var(--primary)",
    fail: "var(--danger)",
  };
  return (
    <div className="admin-stat" style={{ borderColor: colors[status] }}>
      <span>{label}</span>
      <strong style={{ color: colors[status] }}>{value}</strong>
    </div>
  );
}