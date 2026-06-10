import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "إتمام الطلب | DR.IT",
  description: "أكمل عملية الشراء في متجر DR.IT.",
};

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CheckoutClient } from "@/components/checkout-client";
import { Header } from "@/components/header";

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="listing-page">
        <Breadcrumbs items={[{ label: "الرئيسية", href: "/" }, { label: "إتمام الطلب" }]} />
        <h1 className="page-title">إتمام الطلب</h1>
        <CheckoutClient />
      </main>
    </>
  );
}