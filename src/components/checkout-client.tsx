"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { useCart } from "@/components/cart-context";
import { calculateTax, formatPrice } from "@/lib/money";

export function CheckoutClient() {
  const router = useRouter();
  const { items, lines, subtotal, clearCart } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  async function submit(formData: FormData) {
    setError(null);
    setLoading(true);
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customerName: formData.get("customerName"),
        customerPhone: formData.get("customerPhone"),
        address: formData.get("address"),
        notes: formData.get("notes"),
        items,
      }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "تعذر إنشاء الطلب");
      return;
    }

    clearCart();
    router.push(`/order-confirmation/${data.orderId}`);
  }

  if (lines.length === 0) {
    return <EmptyState title="لا يمكن إنشاء طلب فارغ" description="عربة التسوق فارغة حاليا." />;
  }

  return (
    <section className="checkout-layout">
      <form className="checkout-form" action={submit}>
        {error ? <div className="form-error">{error}</div> : null}
        <label>الاسم<input name="customerName" required /></label>
        <label>الهاتف<input name="customerPhone" required /></label>
        <label>العنوان<textarea name="address" required /></label>
        <label>ملاحظات<textarea name="notes" /></label>
        <button type="submit" disabled={loading}>{loading ? "جاري تأكيد الطلب..." : "تأكيد الطلب"}</button>
      </form>
      <aside className="summary-box">
        <h2>ملخص الطلب</h2>
        <dl>
          <div><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
          <div><dt>Tax</dt><dd>{formatPrice(tax)}</dd></div>
          <div><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
        </dl>
      </aside>
    </section>
  );
}
