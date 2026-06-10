import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://e8ckwwkc80wgwkowockggkcw.72.62.33.222.sslip.io";

  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { id: true, updatedAt: true } }),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true } }),
    prisma.brand.findMany({ where: { isActive: true }, select: { slug: true } }),
  ]);

  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/latest`, lastModified: new Date() },
    { url: `${baseUrl}/categories`, lastModified: new Date() },
    { url: `${baseUrl}/brands`, lastModified: new Date() },
    ...categories.map((c) => ({ url: `${baseUrl}/categories/${c.slug}`, lastModified: new Date() })),
    ...brands.map((b) => ({ url: `${baseUrl}/brands/${b.slug}`, lastModified: new Date() })),
    ...products.map((p) => ({ url: `${baseUrl}/product/${p.id}`, lastModified: p.updatedAt })),
  ];
}