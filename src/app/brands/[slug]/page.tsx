import type { Metadata } from "next";

type BrandPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string; available?: string }>;
};

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);
  try {
    const { getBrandBySlug } = await import("@/lib/products");
    const brand = await getBrandBySlug(slug);
    if (brand) {
      return {
        title: `${brand.name} | DR.IT`,
        description: `تسوق منتجات ${brand.name} في متجر DR.IT التقني.`,
        openGraph: {
          title: `${brand.name} | DR.IT`,
          description: `تسوق منتجات ${brand.name} في متجر DR.IT التقني.`,
          siteName: "DR.IT",
          type: "website",
        },
      };
    }
  } catch {}
  return { title: "العلامة التجارية | DR.IT" };
}

import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CategorySidebar } from "@/components/category-sidebar";
import { EmptyState } from "@/components/empty-state";
import { Header } from "@/components/header";
import { Pagination } from "@/components/pagination";
import { ProductCard } from "@/components/product-card";
import { StoreFilters } from "@/components/store-filters";
import { getBrandBySlug, getPaginatedStoreProducts, getStoreCategories, type ProductSort } from "@/lib/products";

export default async function BrandPage({ params, searchParams }: BrandPageProps) {
  const resolvedParams = await params;
  const query = await searchParams;
  const slug = decodeURIComponent(resolvedParams.slug);
  const brand = await getBrandBySlug(slug);

  if (!brand) notFound();

  const result = await getPaginatedStoreProducts({
    page: Number(query.page ?? "1") || 1,
    pageSize: 20,
    sort: (query.sort ?? "latest") as ProductSort,
    availableOnly: query.available === "1",
    brandSlug: slug,
  });

  const categories = await getStoreCategories();

  return (
    <>
      <Header active="العلامات التجارية" />
      <main className="site-shell">
        <CategorySidebar categories={categories.map((c) => ({ name: c.nameAr, slug: c.slug }))} />
        <section className="content-column">
          <Breadcrumbs items={[{ label: "الرئيسية", href: "/" }, { label: "العلامات التجارية", href: "/brands" }, { label: brand.name }]} />
          <div className="listing-meta">عدد المنتجات : <b>{result.total}</b></div>
          <h1 className="page-title">{brand.name}</h1>
          <StoreFilters basePath={`/brands/${encodeURIComponent(slug)}`} searchParams={query} />
          {result.products.length > 0 ? (
            <>
              <div className="product-grid listing-grid">
                {result.products.map((product) => (
                  <ProductCard product={product} key={product.id} />
                ))}
              </div>
              <Pagination page={result.page} totalPages={result.totalPages} basePath={`/brands/${encodeURIComponent(slug)}`} searchParams={query} />
            </>
          ) : (
            <EmptyState title="لا توجد منتجات لهذه العلامة" />
          )}
        </section>
      </main>
    </>
  );
}