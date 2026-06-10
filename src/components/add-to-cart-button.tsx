"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-context";

type AddToCartButtonProps = {
  productId: string;
  className?: string;
  iconSize?: number;
  children?: React.ReactNode;
};

export function AddToCartButton({
  productId,
  className,
  iconSize = 24,
  children = "إضافة إلى عربة التسوق",
}: AddToCartButtonProps) {
  const { addItem } = useCart();

  return (
    <button className={className} type="button" onClick={() => addItem(productId)}>
      <ShoppingCart size={iconSize} />
      {children}
    </button>
  );
}
