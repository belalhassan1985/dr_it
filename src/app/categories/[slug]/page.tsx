import type { Metadata } from "next";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string; available?: string }>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);
  try {
    const { getCategoryBySlug } = await import("@/lib/products");
    const category = await getCategoryBySlug(slug);
    if (category) {
      return {
        title: `${category.nameAr} | DR.IT`,
        description: `تسوق منتجات قسم ${category.nameAr} في متجر DR.IT التقني.`,
        openGraph: {
          title: `${category.nameAr} | DR.IT`,
          description: `تسوق منتجات قسم ${category.nameAr} في متجر DR.IT التقني.`,
          siteName: "DR.IT",
          type: "website",
        },
      };
    }
  } catch {}
  return { title: "القسم | DR.IT" };
}

import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CategorySidebar } from "@/components/category-sidebar";
import { EmptyState } from "@/components/empty-state";
import { Header } from "@/components/header";
import { Pagination } from "@/components/pagination";
import { ProductCard } from "@/components/product-card";
import { StoreFilters } from "@/components/store-filters";
import { getCategoryBySlug, getPaginatedStoreProducts, getStoreCategories, type ProductSort } from "@/lib/products";

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const resolvedParams = await params;
  const query = await searchParams;
  const slug = decodeURIComponent(resolvedParams.slug);
  const category = await getCategoryBySlug(slug);

  if (!category) notFound();

  const result = await getPaginatedStoreProducts({
    page: Number(query.page ?? "1") || 1,
    pageSize: 20,
    sort: (query.sort ?? "latest") as ProductSort,
    availableOnly: query.available === "1",
    categorySlug: slug,
  });

  const categories = await getStoreCategories();

  return (
    <>
      <Header />
      <main className="site-shell">
        <CategorySidebar categories={categories.map((c) => ({ name: c.nameAr, slug: c.slug }))} />
        <section className="content-column">
          <Breadcrumbs items={[{ label: "الرئيسية", href: "/" }, { label: "الأقسام", href: "/categories" }, { label: category.nameAr }]} />
          <div className="listing-meta">عدد المنتجات : <b>{result.total}</b></div>
          <h1 className="page-title">{category.nameAr}</h1>
          <StoreFilters basePath={`/categories/${encodeURIComponent(slug)}`} searchParams={query} />
          {result.products.length > 0 ? (
            <>
              <div className="product-grid listing-grid">
                {result.products.map((product) => (
                  <ProductCard product={product} key={product.id} />
                ))}
              </div>
              <Pagination page={result.page} totalPages={result.totalPages} basePath={`/categories/${encodeURIComponent(slug)}`} searchParams={query} />
            </>
          ) : (
            <EmptyState title="لا توجد منتجات في هذا القسم" />
          )}
        </section>
      </main>
    </>
  );
}