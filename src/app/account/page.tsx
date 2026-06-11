import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "حسابي | DR.IT",
  description: "إدارة حسابك وعرض طلباتك في متجر DR.IT.",
  robots: { index: false, follow: false },
};

import Link from "next/link";
import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Header } from "@/components/header";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/money";
import { getOrderStatusLabel } from "@/lib/order-status";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [ordersCount, latestOrders] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: true },
    }),
  ]);

  return (
    <>
      <Header />
      <main className="listing-page">
        <Breadcrumbs items={[{ label: "الرئيسية", href: "/" }, { label: "حسابي" }]} />
        <h1 className="page-title">حسابي</h1>
        <section className="checkout-layout">
          <aside className="summary-box">
            <h2>بيانات المستخدم</h2>
            <dl>
              <div><dt>الاسم</dt><dd>{user.name ?? "-"}</dd></div>
              <div><dt>البريد</dt><dd>{user.email}</dd></div>
              <div><dt>الهاتف</dt><dd>{user.phone ?? "-"}</dd></div>
              <div><dt>عدد الطلبات</dt><dd>{ordersCount}</dd></div>
            </dl>
          </aside>
          <div className="cart-page-lines">
            <div className="cart-page-head">
              <h2>آخر الطلبات</h2>
              <Link className="checkout-link" href="/account/orders">كل الطلبات</Link>
            </div>
            {latestOrders.length === 0 ? (
              <p className="admin-muted">لا توجد طلبات حتى الآن.</p>
            ) : latestOrders.map((order) => (
              <article className="cart-page-line" key={order.id}>
                <div>
                  <h2>{order.orderNo}</h2>
                  <p>{getOrderStatusLabel(order.status)} - {order.createdAt.toLocaleDateString("ar-IQ")}</p>
                  <strong>{order.items.length} منتج</strong>
                </div>
                <strong>{formatPrice(order.total)}</strong>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}