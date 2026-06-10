import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/header";
import { CategorySidebar } from "@/components/category-sidebar";
import { ProductCard } from "@/components/product-card";
import { getLatestStoreProducts, getStoreCategories } from "@/lib/products";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: {
    default: "DR.IT | متجر التقنية الذكية",
    template: "%s | DR.IT",
  },
  description: "تسوق أفضل المنتجات التقنية في متجر DR.IT - شبكات، طباعة، شاشات، واكسسوارات العمل الذكي.",
  openGraph: {
    title: "DR.IT | متجر التقنية الذكية",
    description: "تسوق أفضل المنتجات التقنية في متجر DR.IT - شبكات، طباعة، شاشات، واكسسوارات العمل الذكي.",
    siteName: "DR.IT",
    type: "website",
  },
};

export default async function Home() {
  const [products, categories] = await Promise.all([
    getLatestStoreProducts(20),
    getStoreCategories(),
  ]);

  const settings = await getSettings(["site.name", "site.description", "company.name"]);

  return (
    <>
      <Header active="الرئيسية" />
      <main className="site-shell">
        <CategorySidebar categories={categories.map((category) => ({ name: category.nameAr, slug: category.slug }))} />
        <section className="content-column">
          <section className="hero-slider">
            <div className="hero-copy">
              <p>{settings["company.name"]}</p>
              <h1>{settings["site.name"]}</h1>
              <span>{settings["site.description"]}</span>
            </div>
            <div className="hero-products" aria-hidden="true">
              {products.slice(0, 4).map((product, index) => (
                <div className={`hero-product hero-product-${index + 1}`} key={product.id}>
                  <Image src={product.image} alt="" fill sizes="280px" />
                </div>
              ))}
            </div>
          </section>
          <button className="slider-cta">إضغط هنا</button>
          <div className="dots" aria-hidden="true">
            {Array.from({ length: 18 }).map((_, index) => (
              <span className={index === 0 ? "active" : ""} key={index} />
            ))}
          </div>
          <h2 className="section-title">أحدث 20 منتج</h2>
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        </section>
      </main>
      <footer className="footer">
        <strong>{settings["site.name"]}</strong>
        <span>{settings["company.name"]}</span>
        <span>&copy; {settings["site.name"]}. All Rights Reserved.</span>
      </footer>
    </>
  );
}