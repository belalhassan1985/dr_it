"use client";

import Link from "next/link";
import { Flame, Home, LayoutGrid, Percent, Search, ShoppingCart, Sparkles, Tag } from "lucide-react";
import { CartPanel } from "@/components/cart-panel";
import { useCart } from "@/components/cart-context";

const navItems = [
  { label: "الرئيسية", href: "/", icon: Home },
  { label: "آخر المنتجات", href: "/latest", icon: Sparkles },
  { label: "العلامات التجارية", href: "/brands", icon: Tag },
  { label: "الأقسام", href: "/categories", icon: LayoutGrid },
  { label: "الخصومات", href: "/discounts", icon: Percent },
];

type HeaderProps = {
  active?: string;
};

export function Header({ active }: HeaderProps) {
  const { count, cartDrawerOpen, openCartDrawer, closeCartDrawer } = useCart();

  return (
    <>
      <header className="header">
        <div className="middle-header">
          <Link href="/" className="logo" aria-label="DR.IT">
            <span>DR</span><b>.</b><span>IT</span>
          </Link>
          <form className="search-box" action="/search">
            <Search size={20} />
            <input name="q" placeholder="بحث" />
          </form>
          <button className="cart-access" type="button" onClick={openCartDrawer}>
            <span className="cart-icon-wrap">
              <ShoppingCart size={28} />
              <b>{count}</b>
            </span>
            عربة التسوق
          </button>
        </div>
        <nav className="main-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link className={active === item.label ? "active" : ""} href={item.href} key={item.label}>
                <Icon size={18} />
                <span>{item.label}</span>
                {item.label === "الخصومات" ? <Flame size={12} className="discount-flame" /> : null}
              </Link>
            );
          })}
        </nav>
      </header>
      <CartPanel open={cartDrawerOpen} onClose={closeCartDrawer} />
    </>
  );
}
