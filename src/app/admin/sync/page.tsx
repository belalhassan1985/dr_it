import { AdminShell } from "@/components/admin/admin-shell";
import { AdminTable } from "@/components/admin/admin-table";
import { runAnasSync } from "@/lib/admin-actions";
import { prisma } from "@/lib/db";

export default async function SyncAdminPage() {
  const runs = await prisma.syncRun.findMany({ where: { source: "anas" }, orderBy: { startedAt: "desc" }, take: 10 });
  const latest = runs[0];
  const errors = Array.isArray(latest?.failedProducts) ? latest.failedProducts.length : 0;

  return (
    <AdminShell title="Sync">
      <div className="admin-stat-grid">
        <Stat label="آخر Sync" value={latest ? latest.status : "لا يوجد"} />
        <Stat label="منتجات جديدة" value={latest?.newProducts ?? 0} />
        <Stat label="منتجات محدثة" value={latest?.updatedProducts ?? 0} />
        <Stat label="صور محملة" value={latest?.imagesDownloaded ?? 0} />
        <Stat label="الأخطاء" value={errors} />
      </div>
      <form action={runAnasSync} className="admin-form-box"><button>Run Sync Now</button></form>
      <AdminTable>
        <thead><tr><th>الوقت</th><th>الحالة</th><th>المكتشفة</th><th>الجديدة</th><th>المحدثة</th><th>الصور</th><th>الأخطاء</th></tr></thead>
        <tbody>{runs.map((run) => (
          <tr key={run.id}>
            <td>{run.startedAt.toLocaleString("en-GB")}</td><td>{run.status}</td><td>{run.productUrlsFound}</td><td>{run.newProducts}</td><td>{run.updatedProducts}</td><td>{run.imagesDownloaded}</td><td>{Array.isArray(run.failedProducts) ? run.failedProducts.length : 0}</td>
          </tr>
        ))}</tbody>
      </AdminTable>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="admin-stat"><span>{label}</span><strong>{value}</strong></div>;
}
