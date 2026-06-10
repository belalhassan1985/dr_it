import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import type { Prisma } from "@prisma/client";

export type StoreProduct = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  brandSlug: string;
  category: string;
  categorySlug: string;
  price: number;
  stock: number;
  image: string;
  gallery: string[];
  description?: string;
};

export type PaginatedProducts = {
  products: StoreProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ProductSort = "latest" | "price-asc" | "price-desc";

export type ProductQueryOptions = {
  page?: number;
  pageSize?: number;
  sort?: ProductSort;
  availableOnly?: boolean;
  categorySlug?: string;
  brandSlug?: string;
  search?: string;
};

const productInclude = {
  brand: true,
  category: true,
  images: {
    orderBy: { sortOrder: "asc" as const },
  },
};

export async function getLatestStoreProducts(limit = 20): Promise<StoreProduct[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: productInclude,
    orderBy: sourceOrderBy(),
    take: limit,
  });

  return products.map(toStoreProduct);
}

export async function getPaginatedStoreProducts(options: ProductQueryOptions = {}): Promise<PaginatedProducts> {
  const pageSize = options.pageSize ?? 20;
  const safePage = Math.max(1, options.page ?? 1);
  const where = buildProductWhere(options);
  const orderBy = sortOrderBy(options.sort ?? "latest");
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy,
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map(toStoreProduct),
    total,
    page: safePage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getStoreProduct(id: string): Promise<StoreProduct | null> {
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { id },
        { sourceProductId: id },
        { sku: id },
      ],
      isActive: true,
    },
    include: productInclude,
  });

  return product ? toStoreProduct(product) : null;
}

export async function getStoreCategories() {
  return prisma.category.findMany({
    orderBy: [
      { products: { _count: "desc" } },
      { nameAr: "asc" },
    ],
    select: {
      id: true,
      nameAr: true,
      slug: true,
      _count: {
        select: { products: true },
      },
    },
  });
}

export async function getStoreBrands() {
  return prisma.brand.findMany({
    orderBy: [
      { products: { _count: "desc" } },
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { products: true },
      },
    },
  });
}

export async function getCategoryBySlug(slug: string) {
  let category = await prisma.category.findFirst({
    where: { slug: { equals: slug } },
    select: { id: true, nameAr: true, slug: true },
  });
  if (!category) {
    try {
      const decoded = decodeURIComponent(slug);
      if (decoded !== slug) {
        category = await prisma.category.findFirst({
          where: { slug: { equals: decoded } },
          select: { id: true, nameAr: true, slug: true },
        });
      }
    } catch {}
  }
  return category;
}

export async function getBrandBySlug(slug: string) {
  let brand = await prisma.brand.findFirst({
    where: { slug: { equals: slug } },
    select: { id: true, name: true, slug: true },
  });
  if (!brand) {
    try {
      const decoded = decodeURIComponent(slug);
      if (decoded !== slug) {
        brand = await prisma.brand.findFirst({
          where: { slug: { equals: decoded } },
          select: { id: true, name: true, slug: true },
        });
      }
    } catch {}
  }
  return brand;
}

export async function getRelatedStoreProducts(product: StoreProduct, limit = 4): Promise<StoreProduct[]> {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: product.id },
      OR: [
        { category: { nameAr: product.category } },
        { brand: { name: product.brand } },
      ],
    },
    include: productInclude,
    orderBy: sourceOrderBy(),
    take: limit,
  });

  return products.map(toStoreProduct);
}

export { formatPrice };

type ProductWithRelations = Awaited<ReturnType<typeof prisma.product.findMany<{ include: typeof productInclude }>>>[number];

function toStoreProduct(product: ProductWithRelations): StoreProduct {
  const gallery = product.images.map((image) => image.url);

  return {
    id: product.id,
    sku: product.sku,
    name: product.nameAr || product.nameEn || product.sku,
    brand: product.brand.name,
    brandSlug: product.brand.slug,
    category: product.category.nameAr,
    categorySlug: product.category.slug,
    price: product.price,
    stock: product.stockQuantity,
    image: gallery[0] ?? "/images/NoImage.jpg",
    gallery,
    description: product.descriptionAr ?? product.descriptionEn ?? undefined,
  };
}

function sourceOrderBy() {
  return [
    { sourceStockModifiedAt: "desc" as const },
    { sourceProductId: "desc" as const },
    { createdAt: "desc" as const },
  ];
}

function sortOrderBy(sort: ProductSort): Prisma.ProductOrderByWithRelationInput[] {
  if (sort === "price-asc") return [{ price: "asc" }, ...sourceOrderBy()];
  if (sort === "price-desc") return [{ price: "desc" }, ...sourceOrderBy()];
  return sourceOrderBy();
}

function buildProductWhere(options: ProductQueryOptions): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
  };

  if (options.availableOnly) {
    where.stockQuantity = { gt: 0 };
  }

  if (options.categorySlug) {
    where.category = { slug: options.categorySlug };
  }

  if (options.brandSlug) {
    where.brand = { slug: options.brandSlug };
  }

  if (options.search?.trim()) {
    const query = options.search.trim();
    where.OR = [
      { nameAr: { contains: query, mode: "insensitive" } },
      { nameEn: { contains: query, mode: "insensitive" } },
      { sku: { contains: query, mode: "insensitive" } },
      { brand: { name: { contains: query, mode: "insensitive" } } },
      { category: { nameAr: { contains: query, mode: "insensitive" } } },
      { category: { nameEn: { contains: query, mode: "insensitive" } } },
    ];
  }

  return where;
}
