import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DR.IT | متجر التقنية الذكية",
  description: "تسوق أفضل المنتجات التقنية في متجر DR.IT - شبكات، طباعة، شاشات، واكسسوارات العمل الذكي.",
  openGraph: {
    title: "DR.IT | متجر التقنية الذكية",
    description: "تسوق أفضل المنتجات التقنية في متجر DR.IT - شبكات، طباعة، شاشات، واكسسوارات العمل الذكي.",
    siteName: "DR.IT",
    type: "website",
  },
};

import Image from "next/image";
import { Header } from "@/components/header";
import { CategorySidebar } from "@/components/category-sidebar";
import { ProductCard } from "@/components/product-card";
import { getLatestStoreProducts, getStoreCategories } from "@/lib/products";

export default async function Home() {
  const [products, categories] = await Promise.all([
    getLatestStoreProducts(20),
    getStoreCategories(),
  ]);

  return (
    <>
      <Header active="الرئيسية" />
      <main className="site-shell">
        <CategorySidebar categories={categories.map((category) => ({ name: category.nameAr, slug: category.slug }))} />
        <section className="content-column">
          <section className="hero-slider" aria-label="عروض DR.IT">
            <div className="hero-copy">
              <p>DR.IT Technology & Trading</p>
              <h1>DR.IT</h1>
              <span>منتجات تقنية مختارة للشبكات، الطباعة، الشاشات، واكسسوارات العمل الذكي.</span>
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
      <Footer />
    </>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <strong>DR.IT</strong>
      <span>DR.IT Technology & Trading</span>
      <span>&copy; DR.IT. All Rights Reserved.</span>
    </footer>
  );
}