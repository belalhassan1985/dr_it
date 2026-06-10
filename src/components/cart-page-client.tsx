"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useCart } from "@/components/cart-context";
import { calculateTax, formatPrice } from "@/lib/money";

export function CartPageClient() {
  const { lines, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  if (lines.length === 0) {
    return <EmptyState title="عربة التسوق فارغة" description="أضف منتجات من المتجر لتظهر هنا." />;
  }

  return (
    <section className="cart-page-layout">
      <div className="cart-page-lines">
        {lines.map((line) => (
          <article className="cart-page-line" key={line.id}>
            <Image src={line.image} alt="" width={96} height={96} />
            <div>
              <h2>{line.name}</h2>
              <p>SKU Code : {line.sku}</p>
              <strong>{formatPrice(line.price)}</strong>
            </div>
            <div className="quantity-row cart-quantity">
              <button type="button" onClick={() => updateQuantity(line.id, line.quantity + 1)} aria-label="زيادة">
                <Plus size={18} />
              </button>
              <div className="quantity-select">{line.quantity}</div>
              <button type="button" onClick={() => updateQuantity(line.id, line.quantity - 1)} aria-label="إنقاص">
                <Minus size={18} />
              </button>
            </div>
            <strong>{formatPrice(line.lineTotal)}</strong>
            <button className="danger-icon" type="button" onClick={() => removeItem(line.id)} aria-label="حذف">
              <Trash2 size={20} />
            </button>
          </article>
        ))}
      </div>
      <aside className="summary-box">
        <h2>ملخص الطلب</h2>
        <dl>
          <div><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
          <div><dt>Tax</dt><dd>{formatPrice(tax)}</dd></div>
          <div><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
        </dl>
        <Link className="checkout-link" href="/checkout">الانتقال إلى Checkout</Link>
        <button type="button" className="clear-cart" onClick={() => window.confirm("هل تريد تفريغ السلة؟") ? clearCart() : undefined}>
          تفريغ السلة
        </button>
      </aside>
    </section>
  );
}
