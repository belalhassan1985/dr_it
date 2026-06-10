import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "البحث | DR.IT",
  description: "ابحث عن المنتجات التقنية في متجر DR.IT.",
};

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CategorySidebar } from "@/components/category-sidebar";
import { EmptyState } from "@/components/empty-state";
import { Header } from "@/components/header";
import { Pagination } from "@/components/pagination";
import { ProductCard } from "@/components/product-card";
import { StoreFilters } from "@/components/store-filters";
import { getPaginatedStoreProducts, getStoreCategories, type ProductSort } from "@/lib/products";

type SearchPageProps = {
  searchParams: Promise<{ q?: string; page?: string; sort?: ProductSort; available?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const result = await getPaginatedStoreProducts({
    page: Number(params.page ?? "1") || 1,
    pageSize: 20,
    sort: params.sort ?? "latest",
    availableOnly: params.available === "1",
    search: params.q,
  });

  const categories = await getStoreCategories();

  return (
    <>
      <Header />
      <main className="site-shell">
        <CategorySidebar categories={categories.map((c) => ({ name: c.nameAr, slug: c.slug }))} />
        <section className="content-column">
          <Breadcrumbs items={[{ label: "الرئيسية", href: "/" }, { label: "البحث" }]} />
          <h1 className="page-title">البحث</h1>
          <StoreFilters basePath="/search" searchParams={params} showSearch queryPlaceholder="ابحث بالاسم أو SKU أو العلامة أو القسم" />
          {params.q ? <div className="listing-meta">نتائج البحث : <b>{result.total}</b></div> : null}
          {result.products.length > 0 ? (
            <>
              <div className="product-grid listing-grid">
                {result.products.map((product) => (
                  <ProductCard product={product} key={product.id} />
                ))}
              </div>
              <Pagination page={result.page} totalPages={result.totalPages} basePath="/search" searchParams={params} />
            </>
          ) : (
            <EmptyState title="لا توجد نتائج" description="جرّب كلمة بحث مختلفة أو أزل بعض الفلاتر." />
          )}
        </section>
      </main>
    </>
  );
}