import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CategorySidebar } from "@/components/category-sidebar";
import { Header } from "@/components/header";
import { ProductDetailClient } from "@/components/product-detail-client";
import { ProductCard } from "@/components/product-card";
import { getRelatedStoreProducts, getStoreProduct, getStoreCategories } from "@/lib/products";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getStoreProduct(id);
  if (!product) return { title: "المنتج غير موجود | DR.IT" };

  const title = `${product.name} | DR.IT`;
  const description = product.description ?? `تسوق ${product.name} من ${product.brand} في متجر DR.IT التقني.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "DR.IT",
      type: "website",
      images: [{ url: product.image, width: 680, height: 680, alt: product.name }],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getStoreProduct(id);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedStoreProducts(product, 4);
  const categories = await getStoreCategories();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    category: product.category,
    description: product.description ?? `تسوق ${product.name} من ${product.brand} في متجر DR.IT.`,
    image: product.gallery.length > 0 ? product.gallery : [product.image],
    offers: {
      "@type": "Offer",
      price: (product.price / 100).toFixed(2),
      priceCurrency: "IQD",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: "/" },
      { "@type": "ListItem", position: 2, name: product.category, item: `/categories/${product.categorySlug}` },
      { "@type": "ListItem", position: 3, name: product.name },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }} />
      <Header />
      <main className="site-shell">
        <CategorySidebar categories={categories.map((c) => ({ name: c.nameAr, slug: c.slug }))} />
        <section className="content-column">
          <Breadcrumbs items={[
            { label: "الرئيسية", href: "/" },
            { label: product.category, href: `/categories/${product.categorySlug}` },
            { label: product.name },
          ]} />
          <ProductDetailClient
            id={product.id}
            name={product.name}
            price={product.price}
            sku={product.sku}
            brand={product.brand}
            stock={product.stock}
            image={product.image}
            gallery={product.gallery}
            description={product.description}
          />
          {relatedProducts.length > 0 ? (
            <section className="related-products">
              <h2 className="section-title">منتجات مشابهة</h2>
              <div className="product-grid">
                {relatedProducts.map((item) => (
                  <ProductCard product={item} key={item.id} />
                ))}
              </div>
            </section>
          ) : null}
        </section>
      </main>
    </>
  );
}