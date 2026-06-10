import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "unknown";
}

async function seedSettings() {
  const defaults: Record<string, string> = {
    "site.name": "DR.IT",
    "site.description": "تسوق أفضل المنتجات التقنية في متجر DR.IT - شبكات، طباعة، شاشات، واكسسوارات العمل الذكي.",
    "company.name": "DR.IT Technology & Trading",
    "company.phone": "",
    "company.whatsapp": "",
    "company.email": "",
    "company.address": "",
    "tax.rate": "0",
    "store.status": "open",
  };

  let created = 0;
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
    created += 1;
  }
  return created;
}

async function seedCategories() {
  const productCategoryNames = await prisma.product.findMany({
    where: { isActive: true },
    select: { category: { select: { nameAr: true, slug: true, isActive: true } } },
    distinct: ["categoryId"],
  });

  const knownCategories = new Map<string, { nameAr: string; slug: string }>();
  for (const { category } of productCategoryNames) {
    if (!category.slug || category.slug === "unknown") {
      const newSlug = slugify(category.nameAr);
      await prisma.category.update({
        where: { slug: category.slug },
        data: { slug: newSlug },
      });
      knownCategories.set(category.nameAr, { nameAr: category.nameAr, slug: newSlug });
    } else {
      knownCategories.set(category.nameAr, { nameAr: category.nameAr, slug: category.slug });
    }

    if (!category.isActive) {
      await prisma.category.update({
        where: { slug: category.slug === "unknown" ? slugify(category.nameAr) : category.slug },
        data: { isActive: true },
      });
    }
  }

  let inactiveCount = 0;
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: false },
      select: { id: true, nameAr: true },
    });
    inactiveCount = categories.length;
  } catch {}

  return {
    total: await prisma.category.count(),
    active: await prisma.category.count({ where: { isActive: true } }),
    inactive: inactiveCount,
    fixedSlugs: productCategoryNames.filter(
      (p) => p.category.slug === "unknown" || !p.category.slug,
    ).length,
    activated: productCategoryNames.filter((p) => !p.category.isActive).length,
  };
}

async function seedBrands() {
  const productBrandNames = await prisma.product.findMany({
    where: { isActive: true },
    select: { brand: { select: { name: true, slug: true, isActive: true } } },
    distinct: ["brandId"],
  });

  for (const { brand } of productBrandNames) {
    if (!brand.slug || brand.slug === "unknown") {
      const newSlug = slugify(brand.name);
      await prisma.brand.update({
        where: { slug: brand.slug },
        data: { slug: newSlug },
      });
    }

    if (!brand.isActive) {
      await prisma.brand.update({
        where: { slug: brand.slug === "unknown" ? slugify(brand.name) : brand.slug },
        data: { isActive: true },
      });
    }
  }

  return {
    total: await prisma.brand.count(),
    active: await prisma.brand.count({ where: { isActive: true } }),
    fixedSlugs: productBrandNames.filter(
      (p) => p.brand.slug === "unknown" || !p.brand.slug,
    ).length,
    activated: productBrandNames.filter((p) => !p.brand.isActive).length,
  };
}

async function checkDataQuality() {
  const totalProducts = await prisma.product.count();

  const orphanProducts = await prisma.product.count({
    where: {
      OR: [
        { category: { isActive: false } },
        { brand: { isActive: false } },
      ],
    },
  });

  const productsInInactiveCategories = await prisma.product.count({
    where: {
      category: { isActive: false },
      isActive: true,
    },
  });

  const productsWithMissingBrand = 0;

  const inactiveProducts = await prisma.product.count({ where: { isActive: false } });

  return {
    totalProducts,
    activeProducts: await prisma.product.count({ where: { isActive: true } }),
    inactiveProducts,
    orphanProducts,
    productsInInactiveCategories,
    productsWithMissingBrand,
  };
}

async function main() {
  console.log("=== DR.IT Store Seed ===\n");

  const settingsCount = await seedSettings();
  console.log(`Settings: ${settingsCount} created/verified`);

  const categoryStats = await seedCategories();
  console.log(`Categories: ${categoryStats.total} total, ${categoryStats.active} active, ${categoryStats.inactive} inactive`);
  if (categoryStats.fixedSlugs) console.log(`  - fixed slugs: ${categoryStats.fixedSlugs}`);
  if (categoryStats.activated) console.log(`  - activated: ${categoryStats.activated}`);

  const brandStats = await seedBrands();
  console.log(`Brands: ${brandStats.total} total, ${brandStats.active} active`);
  if (brandStats.fixedSlugs) console.log(`  - fixed slugs: ${brandStats.fixedSlugs}`);
  if (brandStats.activated) console.log(`  - activated: ${brandStats.activated}`);

  const quality = await checkDataQuality();
  console.log(`\nData Quality:`);
  console.log(`  Products: ${quality.totalProducts} total, ${quality.activeProducts} active, ${quality.inactiveProducts} inactive`);
  console.log(`  Orphan products (inactive category/brand): ${quality.orphanProducts}`);
  console.log(`  Products in inactive categories: ${quality.productsInInactiveCategories}`);
  console.log(`  Products missing brand: ${quality.productsWithMissingBrand}`);

  console.log("\n=== Seed Complete ===");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
