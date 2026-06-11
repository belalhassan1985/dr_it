import type { Metadata } from "next";
import { Header } from "@/components/header";
import { HeroSlider } from "@/components/hero-slider";
import { CategorySidebar } from "@/components/category-sidebar";
import { ProductCard } from "@/components/product-card";
import { getLatestStoreProducts, getStoreCategories } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { getActiveBanners } from "@/lib/banners";

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
  const banners = await getActiveBanners();

  return (
    <>
      <Header active="الرئيسية" />
      <main className="site-shell">
        <CategorySidebar categories={categories.map((category) => ({ name: category.nameAr, slug: category.slug }))} />
        <section className="content-column">
          <HeroSlider
            banners={banners}
            fallback={{
              title: settings["site.name"],
              subtitle: settings["company.name"],
              description: settings["site.description"],
            }}
          />
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