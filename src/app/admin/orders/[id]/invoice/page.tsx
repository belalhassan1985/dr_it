import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { getOrderStatusLabel } from "@/lib/order-status";
import { requireAdminUser } from "@/lib/auth/session";
import { PrintInvoiceButton } from "@/components/admin/print-invoice-button";
import { InvoiceQR } from "@/components/admin/invoice-qr";

export const metadata: Metadata = {
  title: "فاتورة الطلب | DR.IT",
};

type InvoicePageProps = {
  params: Promise<{ id: string }>;
};

export default async function InvoicePage({ params }: InvoicePageProps) {
  await requireAdminUser().catch(() => redirect("/admin/login"));

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();

  const invoiceDate = new Intl.DateTimeFormat("ar-IQ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(order.createdAt);

  return (
    <main className="invoice-page" dir="rtl">
      <div className="invoice-actions">
        <PrintInvoiceButton />
      </div>

      <div className="invoice">
        <div className="invoice-header">
          <div className="invoice-logo">DR<b>.</b>IT</div>
          <div className="invoice-subtitle">Technology & Trading</div>
        </div>

        <div className="invoice-title">فاتورة / Invoice</div>

        <div className="invoice-divider"></div>

        <table className="invoice-meta">
          <tbody>
            <tr><td className="invoice-meta-label">رقم الطلب</td><td className="invoice-meta-value">{order.orderNo}</td></tr>
            <tr><td className="invoice-meta-label">التاريخ</td><td className="invoice-meta-value">{invoiceDate}</td></tr>
            <tr><td className="invoice-meta-label">الحالة</td><td className="invoice-meta-value">{getOrderStatusLabel(order.status)}</td></tr>
            <tr><td className="invoice-meta-label">الزبون</td><td className="invoice-meta-value">{order.customerName}</td></tr>
            {order.customerPhone && (
              <tr><td className="invoice-meta-label">الهاتف</td><td className="invoice-meta-value" dir="ltr">{order.customerPhone}</td></tr>
            )}
            {order.address && (
              <tr><td className="invoice-meta-label">العنوان</td><td className="invoice-meta-value">{order.address}</td></tr>
            )}
          </tbody>
        </table>

        <div className="invoice-divider"></div>

        <table className="invoice-items">
          <thead>
            <tr>
              <th className="invoice-items-col-product">المنتج</th>
              <th className="invoice-items-col-qty">الكمية</th>
              <th className="invoice-items-col-price">السعر</th>
              <th className="invoice-items-col-total">المجموع</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="invoice-items-col-product">{item.name}</td>
                <td className="invoice-items-col-qty">{item.quantity}</td>
                <td className="invoice-items-col-price">{formatPrice(item.price)}</td>
                <td className="invoice-items-col-total">{formatPrice(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-divider"></div>

        <table className="invoice-totals">
          <tbody>
            <tr>
              <td className="invoice-totals-label">المجموع الفرعي</td>
              <td className="invoice-totals-value">{formatPrice(order.subtotal)}</td>
            </tr>
            <tr>
              <td className="invoice-totals-label">الضريبة</td>
              <td className="invoice-totals-value">{formatPrice(order.tax)}</td>
            </tr>
            <tr className="invoice-totals-grand">
              <td className="invoice-totals-label">الإجمالي النهائي</td>
              <td className="invoice-totals-value">{formatPrice(order.total)}</td>
            </tr>
          </tbody>
        </table>

        <InvoiceQR orderId={order.id} />

        <div className="invoice-footer">
          <div className="invoice-divider"></div>
          <p className="invoice-thanks">
            شكراً لتسوقك من <b>DR.IT</b><br />
            نتمنى لك يوماً سعيداً
          </p>
        </div>
      </div>

      <style>{`
        .invoice-page {
          background: #fff;
          color: #000;
          min-height: 100vh;
          font-family: "Cairo", sans-serif;
        }

        .invoice-actions {
          text-align: center;
          padding: 20px;
          background: #f5f5f5;
          border-bottom: 1px solid #ddd;
        }
        .invoice-print-btn {
          padding: 10px 28px;
          font-size: 15px;
          font-weight: 700;
          font-family: "Cairo", sans-serif;
          border: 1px solid #222;
          border-radius: 6px;
          background: #fff;
          color: #000;
          cursor: pointer;
        }
        .invoice-print-btn:hover {
          background: #222;
          color: #fff;
        }

        .invoice {
          width: 80mm;
          max-width: 80mm;
          margin: 0 auto;
          padding: 8mm 4mm;
          font-size: 11px;
          line-height: 1.6;
        }

        .invoice-header {
          text-align: center;
          margin-bottom: 6px;
        }
        .invoice-logo {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .invoice-logo b {
          color: #000;
        }
        .invoice-subtitle {
          font-size: 10px;
          color: #555;
        }

        .invoice-title {
          text-align: center;
          font-size: 14px;
          font-weight: 700;
          margin: 8px 0;
          letter-spacing: 1px;
        }

        .invoice-divider {
          border-top: 1px dashed #999;
          margin: 8px 0;
        }

        .invoice-meta {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        .invoice-meta td {
          padding: 2px 0;
          vertical-align: top;
        }
        .invoice-meta-label {
          width: 32%;
          color: #555;
          font-weight: 700;
        }
        .invoice-meta-value {
          width: 68%;
        }

        .invoice-items {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        .invoice-items th {
          font-weight: 700;
          padding: 4px 2px;
          border-bottom: 1px solid #000;
          text-align: center;
          font-size: 10px;
        }
        .invoice-items-col-product {
          text-align: right;
          width: 40%;
        }
        .invoice-items-col-qty {
          width: 18%;
        }
        .invoice-items-col-price {
          width: 21%;
        }
        .invoice-items-col-total {
          width: 21%;
        }
        .invoice-items td {
          padding: 4px 2px;
          border-bottom: 1px dotted #ccc;
          vertical-align: top;
        }
        .invoice-items td.invoice-items-col-product {
          text-align: right;
          word-break: break-word;
        }
        .invoice-items td.invoice-items-col-qty,
        .invoice-items td.invoice-items-col-price,
        .invoice-items td.invoice-items-col-total {
          text-align: center;
        }

        .invoice-totals {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        .invoice-totals td {
          padding: 3px 2px;
        }
        .invoice-totals-label {
          text-align: right;
          color: #555;
        }
        .invoice-totals-value {
          text-align: left;
          direction: ltr;
        }
        .invoice-totals-grand td {
          font-weight: 900;
          font-size: 13px;
          border-top: 1px double #000;
          padding-top: 5px;
          color: #000;
        }

        .invoice-qr {
          text-align: center;
          margin: 10px 0 6px;
        }
        .invoice-qr-img {
          display: inline-block;
          width: 140px;
          height: 140px;
        }
        .invoice-qr-label {
          font-size: 9px;
          color: #777;
          margin-top: 2px;
        }

        .invoice-footer {
          margin-top: 12px;
        }
        .invoice-thanks {
          text-align: center;
          font-size: 11px;
          color: #444;
          margin-top: 8px;
          line-height: 2;
        }
        .invoice-thanks b {
          font-weight: 900;
          color: #000;
        }

        @page {
          size: 80mm auto;
          margin: 0;
        }

        @media print {
          body {
            background: #fff !important;
          }
          .invoice-page {
            background: #fff;
          }
          .invoice-actions {
            display: none !important;
          }
          .invoice {
            padding: 4mm 3mm;
            width: 80mm;
            max-width: 80mm;
            margin: 0;
          }
          .invoice-divider {
            border-top: 1px dashed #aaa;
          }
          .invoice-items td,
          .invoice-items th {
            border-color: #888;
          }
        }

        @media (max-width: 420px) {
          .invoice {
            width: 100%;
            max-width: 100%;
            padding: 4mm 3mm;
          }
        }
      `}</style>
    </main>
  );
}
