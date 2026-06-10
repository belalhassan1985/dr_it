import { AdminShell } from "@/components/admin/admin-shell";
import { AdminTable } from "@/components/admin/admin-table";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";

export default async function CustomersAdminPage() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, include: { items: true } });
  const customers = new Map<string, { name: string; phone: string; orders: number; total: number; details: string[] }>();

  for (const order of orders) {
    const key = order.customerPhone || order.customerName;
    const current = customers.get(key) ?? { name: order.customerName, phone: order.customerPhone ?? "-", orders: 0, total: 0, details: [] };
    current.orders += 1;
    current.total += order.total;
    current.details.push(`${order.orderNo} - ${formatPrice(order.total)}`);
    customers.set(key, current);
  }

  return (
    <AdminShell title="Customers">
      <AdminTable>
        <thead><tr><th>الاسم</th><th>الهاتف</th><th>عدد الطلبات</th><th>إجمالي المشتريات</th><th>تفاصيل الطلبات</th></tr></thead>
        <tbody>{[...customers.values()].map((customer) => (
          <tr key={customer.phone}>
            <td>{customer.name}</td><td>{customer.phone}</td><td>{customer.orders}</td><td>{formatPrice(customer.total)}</td>
            <td><details><summary>عرض</summary>{customer.details.map((detail) => <p key={detail}>{detail}</p>)}</details></td>
          </tr>
        ))}</tbody>
      </AdminTable>
    </AdminShell>
  );
}
