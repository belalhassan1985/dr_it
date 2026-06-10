import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "عربة التسوق | DR.IT",
  description: "مراجعة المنتجات في عربة التسوق.",
};

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CartPageClient } from "@/components/cart-page-client";
import { Header } from "@/components/header";

export default function CartPage() {
  return (
    <>
      <Header />
      <main className="listing-page">
        <Breadcrumbs items={[{ label: "الرئيسية", href: "/" }, { label: "عربة التسوق" }]} />
        <h1 className="page-title">عربة التسوق</h1>
        <CartPageClient />
      </main>
    </>
  );
}