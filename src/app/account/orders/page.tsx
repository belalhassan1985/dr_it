import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "طلباتي | DR.IT",
  description: "عرض جميع طلباتك في متجر DR.IT.",
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

export default async function AccountOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <>
      <Header />
      <main className="listing-page">
        <Breadcrumbs items={[{ label: "الرئيسية", href: "/" }, { label: "حسابي", href: "/account" }, { label: "طلباتي" }]} />
        <h1 className="page-title">طلباتي</h1>
        <section className="cart-page-lines">
          {orders.length === 0 ? (
            <div className="summary-box">
              <h2>لا توجد طلبات</h2>
              <p>ستظهر طلباتك هنا بعد إتمام أول عملية شراء.</p>
              <Link className="checkout-link" href="/latest">تصفح المنتجات</Link>
            </div>
          ) : orders.map((order) => (
            <article className="cart-page-line" key={order.id}>
              <div>
                <h2>{order.orderNo}</h2>
                <p>{getOrderStatusLabel(order.status)} - {order.createdAt.toLocaleDateString("ar-IQ")}</p>
                <p>{order.items.map((item) => `${item.name} x ${item.quantity}`).join("، ")}</p>
              </div>
              <div>
                <strong>{formatPrice(order.total)}</strong>
                <Link className="checkout-link" href={`/order-confirmation/${order.id}`}>التفاصيل</Link>
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}