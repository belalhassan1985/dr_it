import { prisma } from "@/lib/db";
import { downloadProductImage } from "@/lib/import/download-image";
import { absoluteUrl, stripTags, type ScrapedProduct } from "@/lib/import/anas-parser";

const BASE_URL = "https://anas-iq.com";
const API_BASE_URL = "https://api.anas-iq.com";

type AnasApiProduct = {
  id: number;
  name?: string;
  name_ar?: string;
  price?: number;
  price_in_iqd?: number;
  SKU_code?: string;
  number_of_items?: number;
  description?: string;
  description_ar?: string;
  image?: string;
  image_2?: string;
  image_3?: string;
  category_name?: string;
  category_name_ar?: string;
  company_name?: string;
  company_name_ar?: string;
  created?: string;
  modified?: string;
  number_of_items_modified_from_zero?: string;
};

type AnasApiResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AnasApiProduct[];
};

export type ImportResult = {
  status: "completed" | "completed_with_errors" | "failed" | "skipped";
  syncRunId: string | null;
  pagesScanned: number;
  productUrlsFound: number;
  importedProducts: number;
  newProducts: number;
  updatedProducts: number;
  imagesDownloaded: number;
  failedProducts: Array<{ url: string; reason: string }>;
  duration: number;
  error?: string;
};

export type ImportOptions = {
  pages?: number[];
  limit?: number;
};

export async function runAnasImport(options?: ImportOptions): Promise<ImportResult> {
  const startedAt = Date.now();
  const pages = options?.pages ?? parsePages(process.env.ANAS_IMPORT_PAGES);
  const limit = options?.limit ?? parseLimit(process.env.ANAS_IMPORT_LIMIT);
  const failedProducts: Array<{ url: string; reason: string }> = [];

  const staleThreshold = new Date(Date.now() - 15 * 60 * 1000);
  const existingRunning = await prisma.syncRun.findFirst({
    where: { source: "anas", status: "running", startedAt: { gte: staleThreshold } },
  });
  if (existingRunning) {
    return {
      status: "skipped",
      syncRunId: existingRunning.id,
      pagesScanned: 0,
      productUrlsFound: 0,
      importedProducts: 0,
      newProducts: 0,
      updatedProducts: 0,
      imagesDownloaded: 0,
      failedProducts: [],
      duration: Date.now() - startedAt,
      error: `Sync is already running (started at ${existingRunning.startedAt.toISOString()})`,
    };
  }

  const syncRun = await prisma.syncRun.create({
    data: {
      source: "anas",
      status: "running",
      startedAt: new Date(),
    },
  });

  try {
    const apiProducts: AnasApiProduct[] = [];

    for (const page of pages) {
      const pageUrl = `${API_BASE_URL}/product/?page=${page}`;
      const data = await fetchJson<AnasApiResponse>(pageUrl);
      apiProducts.push(...data.results);
    }

    const uniqueProducts = dedupeApiProducts(apiProducts);
    const products = limit !== undefined ? uniqueProducts.slice(0, limit) : uniqueProducts;

    const stats = {
      pagesScanned: pages.length,
      productUrlsFound: uniqueProducts.length,
      importedProducts: 0,
      newProducts: 0,
      updatedProducts: 0,
      imagesDownloaded: 0,
    };

    for (const apiProduct of products) {
      const sourceUrl = `${BASE_URL}/item?id=${apiProduct.id}`;
      try {
        const scraped = mapApiProduct(apiProduct);
        const result = await upsertProduct(scraped, failedProducts);
        stats.importedProducts += 1;
        stats.imagesDownloaded += result.imagesDownloaded;
        if (result.wasNew) stats.newProducts += 1;
        else stats.updatedProducts += 1;
      } catch (error) {
        failedProducts.push({
          url: sourceUrl,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const finalStatus = failedProducts.length > 0 ? "completed_with_errors" : "completed";

    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: finalStatus,
        pagesScanned: stats.pagesScanned,
        productUrlsFound: stats.productUrlsFound,
        importedProducts: stats.importedProducts,
        newProducts: stats.newProducts,
        updatedProducts: stats.updatedProducts,
        imagesDownloaded: stats.imagesDownloaded,
        failedProducts,
        finishedAt: new Date(),
      },
    });

    return {
      status: finalStatus,
      syncRunId: syncRun.id,
      ...stats,
      failedProducts,
      duration: Date.now() - startedAt,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "failed",
        failedProducts: failedProducts.length > 0 ? failedProducts : [{ url: "anas-importer", reason: errorMessage }],
        finishedAt: new Date(),
      },
    });

    return {
      status: "failed",
      syncRunId: syncRun.id,
      pagesScanned: 0,
      productUrlsFound: 0,
      importedProducts: 0,
      newProducts: 0,
      updatedProducts: 0,
      imagesDownloaded: 0,
      failedProducts: failedProducts.length > 0 ? failedProducts : [{ url: "anas-importer", reason: errorMessage }],
      duration: Date.now() - startedAt,
      error: errorMessage,
    };
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          accept: "application/json",
          "user-agent": "DR.IT Importer/1.0",
        },
      });
      if (!response.ok) {
        throw new Error(`Fetch failed ${response.status}: ${url}`);
      }
      return response.json() as Promise<T>;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Fetch failed: ${url}`);
}

async function upsertProduct(
  scraped: ScrapedProduct,
  failedProducts: Array<{ url: string; reason: string }>,
) {
  const existing = await prisma.product.findFirst({
    where: {
      OR: [
        { sku: scraped.sku },
        { sourceProductId: scraped.sourceProductId },
      ],
    },
    select: { id: true },
  });

  const category = await prisma.category.upsert({
    where: { slug: slugify(scraped.category) },
    update: { nameAr: scraped.category },
    create: {
      nameAr: scraped.category,
      nameEn: scraped.category,
      slug: slugify(scraped.category),
    },
  });

  const brand = await prisma.brand.upsert({
    where: { slug: slugify(scraped.brand) },
    update: { name: scraped.brand },
    create: {
      name: scraped.brand,
      slug: slugify(scraped.brand),
    },
  });

  const product = existing
    ? await prisma.product.update({
        where: { id: existing.id },
        data: productData(scraped, category.id, brand.id),
      })
    : await prisma.product.create({
        data: productData(scraped, category.id, brand.id),
      });

  await prisma.productImage.deleteMany({ where: { productId: product.id } });

  let imagesDownloaded = 0;
  for (const [index, imageUrl] of scraped.imageUrls.entries()) {
    try {
      const downloaded = await downloadProductImage(imageUrl, scraped.sourceProductId, index);
      await prisma.productImage.upsert({
        where: {
          productId_url: {
            productId: product.id,
            url: downloaded.publicUrl,
          },
        },
        update: {
          alt: scraped.name,
          sortOrder: index,
        },
        create: {
          productId: product.id,
          url: downloaded.publicUrl,
          alt: scraped.name,
          sortOrder: index,
        },
      });
      if (downloaded.downloaded) imagesDownloaded += 1;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      failedProducts.push({
        url: imageUrl,
        reason: `Image ${index + 1} for ${scraped.sku}: ${reason}`,
      });
    }
  }

  return { wasNew: !existing, imagesDownloaded };
}

function productData(scraped: ScrapedProduct, categoryId: string, brandId: string) {
  return {
    sku: scraped.sku,
    sourceProductId: scraped.sourceProductId,
    sourceUrl: scraped.sourceUrl,
    nameAr: scraped.name,
    nameEn: scraped.name,
    descriptionAr: scraped.description,
    descriptionEn: scraped.description,
    sourceCreatedAt: scraped.sourceCreatedAt,
    sourceUpdatedAt: scraped.sourceUpdatedAt,
    sourceStockModifiedAt: scraped.sourceStockModifiedAt ?? scraped.sourceCreatedAt,
    lastSyncedAt: new Date(),
    price: scraped.price,
    stockQuantity: scraped.stockQuantity,
    isActive: true,
    categoryId,
    brandId,
  };
}

function mapApiProduct(product: AnasApiProduct): ScrapedProduct {
  const sourceProductId = String(product.id);
  const imageUrls = [product.image, product.image_2, product.image_3]
    .filter((url): url is string => Boolean(url))
    .map((url) => absoluteUrl(url));
  const descriptionAr = product.description_ar ? stripTags(product.description_ar) : undefined;
  const descriptionEn = product.description ? stripTags(product.description) : undefined;

  return {
    sourceProductId,
    sourceUrl: `${BASE_URL}/item?id=${sourceProductId}`,
    name: product.name_ar || product.name || `Product ${sourceProductId}`,
    sku: product.SKU_code || sourceProductId,
    price: Math.round(product.price_in_iqd ?? product.price ?? 0),
    stockQuantity: product.number_of_items ?? 0,
    category: product.category_name_ar || product.category_name || "متتمات وأدوات",
    brand: product.company_name_ar || product.company_name || "DR.IT",
    imageUrls,
    description: descriptionAr || descriptionEn,
    sourceCreatedAt: parseApiDate(product.created),
    sourceUpdatedAt: parseApiDate(product.modified),
    sourceStockModifiedAt: parseApiDate(product.number_of_items_modified_from_zero),
  };
}

function parseApiDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function dedupeApiProducts(products: AnasApiProduct[]) {
  const byId = new Map<number, AnasApiProduct>();
  for (const product of products) {
    byId.set(product.id, product);
  }
  return [...byId.values()];
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "unknown";
}

function parsePages(raw: string | undefined): number[] {
  if (!raw || raw.trim() === "") return [1, 2, 3];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);
}

function parseLimit(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
