"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart-context";

export function CartToast() {
  const { toast, clearToast } = useCart();

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(clearToast, 2500);
    return () => window.clearTimeout(timeout);
  }, [clearToast, toast]);

  if (!toast) return null;

  return <div className="toast">{toast}</div>;
}
