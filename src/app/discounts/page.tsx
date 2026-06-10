import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الخصومات | DR.IT",
  description: "تسوق المنتجات المخفضة في متجر DR.IT التقني.",
};

import { Breadcrumbs } from "@/components/breadcrumbs";
import { EmptyState } from "@/components/empty-state";
import { Header } from "@/components/header";

export default function DiscountsPage() {
  return (
    <>
      <Header active="الخصومات" />
      <main className="listing-page">
        <Breadcrumbs items={[{ label: "الرئيسية", href: "/" }, { label: "الخصومات" }]} />
        <h1 className="page-title">الخصومات</h1>
        <EmptyState
          title="لا توجد خصومات متاحة حالياً"
          description="سيتم عرض منتجات الخصم هنا عند توفر عروض خاصة."
        />
      </main>
    </>
  );
}