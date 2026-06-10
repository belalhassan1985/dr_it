import type { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "الأقسام | DR.IT",
    description: "تصفح أقسام المنتجات التقنية في متجر DR.IT.",
    openGraph: {
      title: "الأقسام | DR.IT",
      description: "تصفح أقسام المنتجات التقنية في متجر DR.IT.",
      siteName: "DR.IT",
      type: "website",
    },
  };
}

import { Breadcrumbs } from "@/components/breadcrumbs";
import { EntityGrid } from "@/components/entity-grid";
import { Header } from "@/components/header";
import { getStoreCategories } from "@/lib/products";

export default async function CategoriesPage() {
  const categories = await getStoreCategories();

  return (
    <>
      <Header active="الأقسام" />
      <main className="listing-page">
        <Breadcrumbs items={[{ label: "الرئيسية", href: "/" }, { label: "الأقسام" }]} />
        <h1 className="page-title">الأقسام</h1>
        <EntityGrid
          items={categories.map((category) => ({
            name: category.nameAr,
            href: `/categories/${category.slug}`,
            count: category._count.products,
          }))}
        />
      </main>
    </>
  );
}