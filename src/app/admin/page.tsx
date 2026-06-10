import { AdminShell } from "@/components/admin/admin-shell";
import { AdminTable } from "@/components/admin/admin-table";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";

export default async function AdminPage() {
  const [products, categories, brands, orders, stock, unavailable, latestSync, latestOrders] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.brand.count(),
    prisma.order.count(),
    prisma.product.aggregate({ _sum: { stockQuantity: true } }),
    prisma.product.count({ where: { stockQuantity: { lte: 0 } } }),
    prisma.syncRun.findFirst({ where: { source: "anas" }, orderBy: { startedAt: "desc" } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  return (
    <AdminShell title="DR.IT Admin Dashboard">
      <div className="admin-stat-grid">
        <Stat label="عدد المنتجات" value={products} />
        <Stat label="عدد الأقسام" value={categories} />
        <Stat label="عدد العلامات التجارية" value={brands} />
        <Stat label="عدد الطلبات" value={orders} />
        <Stat label="إجمالي المخزون" value={stock._sum.stockQuantity ?? 0} />
        <Stat label="غير المتوفر" value={unavailable} />
        <Stat label="آخر Sync" value={latestSync ? latestSync.status : "لا يوجد"} />
      </div>
      <h2 className="admin-section-title">آخر الطلبات</h2>
      <AdminTable>
        <thead><tr><th>رقم الطلب</th><th>الزبون</th><th>الحالة</th><th>المجموع</th><th>التاريخ</th></tr></thead>
        <tbody>
          {latestOrders.map((order) => (
            <tr key={order.id}>
              <td>{order.orderNo}</td>
              <td>{order.customerName}</td>
              <td>{order.status}</td>
              <td>{formatPrice(order.total)}</td>
              <td>{order.createdAt.toLocaleDateString("en-GB")}</td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="admin-stat"><span>{label}</span><strong>{value}</strong></div>;
}
