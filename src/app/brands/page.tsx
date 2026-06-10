import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "العلامات التجارية | DR.IT",
  description: "تصفح جميع العلامات التجارية في متجر DR.IT التقني.",
  openGraph: {
    title: "العلامات التجارية | DR.IT",
    description: "تصفح جميع العلامات التجارية في متجر DR.IT التقني.",
    siteName: "DR.IT",
    type: "website",
  },
};

import { Breadcrumbs } from "@/components/breadcrumbs";
import { EntityGrid } from "@/components/entity-grid";
import { Header } from "@/components/header";
import { getStoreBrands } from "@/lib/products";

export default async function BrandsPage() {
  const brands = await getStoreBrands();

  return (
    <>
      <Header active="العلامات التجارية" />
      <main className="listing-page">
        <Breadcrumbs items={[{ label: "الرئيسية", href: "/" }, { label: "العلامات التجارية" }]} />
        <h1 className="page-title">العلامات التجارية</h1>
        <EntityGrid
          items={brands.map((brand) => ({
            name: brand.name,
            href: `/brands/${brand.slug}`,
            count: brand._count.products,
          }))}
        />
      </main>
    </>
  );
}