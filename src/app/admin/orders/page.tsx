import { OrderStatus } from "@prisma/client";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminTable } from "@/components/admin/admin-table";
import { updateOrderStatus } from "@/lib/admin-actions";
import { PAGE_SIZE } from "@/lib/admin-utils";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { getOrderStatusLabel } from "@/lib/order-status";

type OrdersAdminPageProps = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

export default async function OrdersAdminPage({ searchParams }: OrdersAdminPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const where = params.q ? {
    OR: [
      { orderNo: { contains: params.q, mode: "insensitive" as const } },
      { customerName: { contains: params.q, mode: "insensitive" as const } },
      { customerPhone: { contains: params.q, mode: "insensitive" as const } },
    ],
  } : {};
  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, include: { items: true }, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.order.count({ where }),
  ]);

  return (
    <AdminShell title="Orders">
      <form className="admin-toolbar"><input name="q" defaultValue={params.q ?? ""} placeholder="بحث بالطلب أو الزبون" /><button>بحث</button></form>
      <AdminTable>
        <thead><tr><th>رقم الطلب</th><th>الزبون</th><th>الهاتف</th><th>الحالة</th><th>المجموع</th><th>التفاصيل</th></tr></thead>
        <tbody>{orders.map((order) => (
          <tr key={order.id}>
            <td>{order.orderNo}</td><td>{order.customerName}</td><td>{order.customerPhone}</td><td>{getOrderStatusLabel(order.status)}</td><td>{formatPrice(order.total)}</td>
            <td>
              <details>
                <summary>عرض</summary>
                <form action={updateOrderStatus} className="admin-inline-form">
                  <input name="id" type="hidden" value={order.id} />
                  <select name="status" defaultValue={order.status}>{Object.values(OrderStatus).map((status) => <option value={status} key={status}>{getOrderStatusLabel(status)}</option>)}</select>
                  <button>تغيير الحالة</button>
                </form>
                <div className="admin-order-items">{order.items.map((item) => <p key={item.id}>{item.name} × {item.quantity} = {formatPrice(item.total)}</p>)}</div>
                <p>{order.address}</p>
              </details>
            </td>
          </tr>
        ))}</tbody>
      </AdminTable>
      <div className="admin-pager"><span>{page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span></div>
    </AdminShell>
  );
}
