"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartProduct = {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  image: string;
};

export type CartLine = CartProduct & {
  quantity: number;
  lineTotal: number;
};

type StoredCartItem = {
  productId: string;
  quantity: number;
};

type CartContextValue = {
  items: StoredCartItem[];
  lines: CartLine[];
  toast: string | null;
  count: number;
  subtotal: number;
  addItem: (productId: string, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  clearToast: () => void;
  cartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "dr-it-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<StoredCartItem[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored) as StoredCartItem[];
    } catch {
      return [];
    }
  });
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    const ids = items.map((item) => item.productId);
    if (ids.length === 0) {
      return;
    }

    fetch(`/api/cart-products?ids=${encodeURIComponent(ids.join(","))}`)
      .then((response) => response.json())
      .then((data: { products: CartProduct[] }) => setProducts(data.products ?? []));
  }, [items]);

  const addItem = useCallback((productId: string, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.productId === productId);
      if (existing) {
        return current.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...current, { productId, quantity }];
    });
    setToast("تمت إضافة المنتج إلى عربة التسوق");
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) => current
      .map((item) => item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item)
      .filter((item) => item.quantity > 0));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
    setToast("تم حذف المنتج من عربة التسوق");
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setToast("تم تفريغ عربة التسوق");
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  const openCartDrawer = useCallback(() => setCartDrawerOpen(true), []);
  const closeCartDrawer = useCallback(() => setCartDrawerOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const lines = items.flatMap((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) return [];
      const quantity = Math.min(item.quantity, Math.max(product.stock, 1));
      return [{ ...product, quantity, lineTotal: product.price * quantity }];
    });
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      lines,
      toast,
      count,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      clearToast,
      cartDrawerOpen,
      openCartDrawer,
      closeCartDrawer,
    };
  }, [addItem, cartDrawerOpen, clearCart, clearToast, closeCartDrawer, items, openCartDrawer, products, removeItem, toast, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
