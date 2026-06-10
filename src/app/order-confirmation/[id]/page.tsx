import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تأكيد الطلب | DR.IT",
  description: "تأكيد واستعراض تفاصيل طلبك في متجر DR.IT.",
  robots: { index: false, follow: false },
};

import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Header } from "@/components/header";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";

type OrderConfirmationPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!order) notFound();

  return (
    <>
      <Header />
      <main className="listing-page">
        <Breadcrumbs items={[{ label: "الرئيسية", href: "/" }, { label: "تأكيد الطلب" }]} />
        <h1 className="page-title">تم استلام الطلب</h1>
        <section className="order-confirmation">
          <div className="order-summary-head">
            <div><span>رقم الطلب</span><strong>{order.orderNo}</strong></div>
            <div><span>حالة الطلب</span><strong>{order.status}</strong></div>
            <div><span>الزبون</span><strong>{order.customerName}</strong></div>
            <div><span>الهاتف</span><strong>{order.customerPhone}</strong></div>
            {order.customerEmail ? <div><span>البريد</span><strong>{order.customerEmail}</strong></div> : null}
          </div>
          <div className="cart-page-lines">
            {order.items.map((item) => (
              <article className="cart-page-line" key={item.id}>
                <Image src={item.product.images[0]?.url ?? "/images/NoImage.jpg"} alt="" width={96} height={96} />
                <div>
                  <h2>{item.name}</h2>
                  <p>SKU Code : {item.sku}</p>
                  <strong>{formatPrice(item.price)} x {item.quantity}</strong>
                </div>
                <strong>{formatPrice(item.total)}</strong>
              </article>
            ))}
          </div>
          <aside className="summary-box">
            <h2>المجموع</h2>
            <dl>
              <div><dt>المجموع الفرعي</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              <div><dt>الضريبة</dt><dd>{formatPrice(order.tax)}</dd></div>
              <div><dt>المجموع</dt><dd>{formatPrice(order.total)}</dd></div>
            </dl>
            {order.address ? <p><strong>العنوان:</strong> {order.address}</p> : null}
            {order.notes ? <p><strong>ملاحظات:</strong> {order.notes}</p> : null}
          </aside>
        </section>
      </main>
    </>
  );
}