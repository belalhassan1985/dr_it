"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { calculateTax, formatPrice } from "@/lib/money";

type CartPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function CartPanel({ open, onClose }: CartPanelProps) {
  const { lines, subtotal, taxRate, updateQuantity, removeItem } = useCart();
  const tax = calculateTax(subtotal, taxRate);
  const total = subtotal + tax;

  return (
    <div className={`cart-layer ${open ? "open" : ""}`} aria-hidden={!open}>
      <button className="cart-backdrop" type="button" onClick={onClose} aria-label="إغلاق السلة" />
      <aside className="cart-panel" aria-label="عربة التسوق">
        <div className="cart-panel-head">
          <h2>عربة التسوق</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="cart-empty">عربة التسوق فارغة حالياً</div>
        ) : (
          <div className="cart-lines">
            {lines.map((line) => (
              <div className="cart-line" key={line.id}>
                <Image src={line.image} alt="" width={62} height={62} />
                <div>
                  <strong>{line.name}</strong>
                  <span>{formatPrice(line.price)}</span>
                  <div className="mini-quantity">
                    <button type="button" onClick={() => updateQuantity(line.id, line.quantity + 1)} aria-label="زيادة">
                      <Plus size={14} />
                    </button>
                    <b>{line.quantity}</b>
                    <button type="button" onClick={() => updateQuantity(line.id, line.quantity - 1)} aria-label="إنقاص">
                      <Minus size={14} />
                    </button>
                  </div>
                </div>
                <button aria-label="حذف" type="button" onClick={() => removeItem(line.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        <dl>
          <div><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
          <div><dt>Tax</dt><dd>{formatPrice(tax)}</dd></div>
          <div><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
        </dl>
        <div className="cart-actions">
          <Link href="/cart" onClick={onClose}>عرض السلة</Link>
          <Link href="/checkout" onClick={onClose}>Checkout</Link>
        </div>
      </aside>
    </div>
  );
}
