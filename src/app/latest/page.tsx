import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    title: "آخر المنتجات | DR.IT",
    description: "تصفح أحدث المنتجات التقنية في متجر DR.IT.",
    openGraph: {
      title: "آخر المنتجات | DR.IT",
      description: "تصفح أحدث المنتجات التقنية في متجر DR.IT.",
      siteName: "DR.IT",
      type: "website",
    },
  };
}

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CategorySidebar } from "@/components/category-sidebar";
import { Header } from "@/components/header";
import { Pagination } from "@/components/pagination";
import { ProductCard } from "@/components/product-card";
import { StoreFilters } from "@/components/store-filters";
import { getPaginatedStoreProducts, getStoreCategories, type ProductSort } from "@/lib/products";

type LatestProductsPageProps = {
  searchParams: Promise<{ page?: string; sort?: ProductSort; available?: string }>;
};

export default async function LatestProductsPage({ searchParams }: LatestProductsPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const result = await getPaginatedStoreProducts({
    page,
    pageSize: 20,
    sort: params.sort ?? "latest",
    availableOnly: params.available === "1",
  });

  const categories = await getStoreCategories();

  return (
    <>
      <Header active="آخر المنتجات" />
      <main className="site-shell">
        <CategorySidebar categories={categories.map((c) => ({ name: c.nameAr, slug: c.slug }))} />
        <section className="content-column">
          <Breadcrumbs items={[{ label: "الرئيسية", href: "/" }, { label: "آخر المنتجات" }]} />
          <div className="listing-meta">عدد المنتجات : <b>{result.total}</b></div>
          <h1 className="page-title">آخر المنتجات</h1>
          <StoreFilters basePath="/latest" searchParams={params} />
          <div className="product-grid listing-grid">
            {result.products.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
          <Pagination page={result.page} totalPages={result.totalPages} basePath="/latest" searchParams={params} />
        </section>
      </main>
    </>
  );
}