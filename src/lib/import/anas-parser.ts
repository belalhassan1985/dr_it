export type ScrapedProduct = {
  sourceProductId: string;
  sourceUrl: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  category: string;
  brand: string;
  imageUrls: string[];
  description?: string;
  sourceCreatedAt?: Date;
  sourceUpdatedAt?: Date;
  sourceStockModifiedAt?: Date;
};

const BASE_URL = "https://anas-iq.com";

export function absoluteUrl(url: string) {
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  return `${BASE_URL}/${url}`;
}

export function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripTags(value: string) {
  return decodeEntities(value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
}

export function parseProductLinks(html: string) {
  const urls = new Set<string>();
  const patterns = [
    /href=["']([^"']*\/item\?id=(\d+)[^"']*)["']/gi,
    /href=["']([^"']*itemId=(\d+)[^"']*)["']/gi,
    /["'](\/item\?id=(\d+)[^"']*)["']/gi,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      urls.add(absoluteUrl(match[1]));
    }
  }

  return [...urls];
}

export function getSourceProductId(url: string) {
  const parsed = new URL(url);
  return parsed.searchParams.get("id") ?? parsed.pathname.split("/").filter(Boolean).at(-1) ?? url;
}

export function parseProductPage(html: string, sourceUrl: string): ScrapedProduct {
  const text = stripTags(html);
  const sourceProductId = getSourceProductId(sourceUrl);
  const title = firstMatch(html, /<title[^>]*>(.*?)<\/title>/is);
  const ogTitle = metaContent(html, "og:title");
  const name = cleanProductName(ogTitle || title || firstTextNear(text, ["SKU Code", "رقم المنتج"]) || `Product ${sourceProductId}`);
  const sku = firstMatch(text, /(?:SKU Code|رقم المنتج)\s*[:：]?\s*([A-Za-z0-9-]+)/i) || sourceProductId;
  const priceText = firstMatch(text, /([\d,]+)\s*IQD/i) || "0";
  const stockText = firstMatch(text, /(?:المخزون|المتوفر في المخزون|في المخزون)\s*[:：]?\s*(?:فقط)?\s*(\d+)/i) || "0";
  const brand = firstMatch(text, /(?:العلامة التجارية|Brand)\s*[:：]?\s*([^\s:،|]+)/i) || inferBrand(name);
  const category = inferCategory(text);
  const description = firstMatch(text, /(?:وصف|Description)\s+(.{20,500})/i);
  const imageUrls = parseImages(html);

  return {
    sourceProductId,
    sourceUrl,
    name,
    sku,
    price: numberFromText(priceText),
    stockQuantity: Number(stockText),
    category,
    brand,
    imageUrls,
    description: description ? decodeEntities(description) : undefined,
  };
}

function firstMatch(value: string, pattern: RegExp) {
  const match = value.match(pattern);
  return match?.[1] ? decodeEntities(match[1]) : undefined;
}

function metaContent(html: string, property: string) {
  const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
  return firstMatch(html, pattern);
}

function firstTextNear(text: string, needles: string[]) {
  for (const needle of needles) {
    const index = text.indexOf(needle);
    if (index > 20) return text.slice(Math.max(0, index - 140), index).split(/\s{2,}/).at(-1);
  }
  return undefined;
}

function cleanProductName(value: string) {
  return decodeEntities(value)
    .replace(/\s*\|\s*Anas-IQ.*$/i, "")
    .replace(/\s*-\s*Anas-IQ.*$/i, "")
    .trim();
}

function numberFromText(value: string) {
  const numeric = value.replace(/[^\d]/g, "");
  return numeric ? Number(numeric) : 0;
}

function inferBrand(name: string) {
  const first = name.split(/\s+/)[0];
  return first && first.length <= 24 ? first : "DR.IT";
}

function inferCategory(text: string) {
  const known = [
    "الطباعة",
    "معدات الشبكات",
    "الشاشات وأجهزة العرض",
    "لابتوبات وحاسبات",
    "تخزين البيانات",
    "كيبلات",
    "حقائب",
    "أجهزة ألعاب",
  ];

  return known.find((category) => text.includes(category)) ?? "متتمات وأدوات";
}

function parseImages(html: string) {
  const urls = new Set<string>();
  const imagePatterns = [
    /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
    /<source[^>]+srcset=["']([^"']+)["'][^>]*>/gi,
    /["'](https?:\/\/[^"']+\.(?:png|jpe?g|webp)(?:\?[^"']*)?)["']/gi,
  ];

  for (const pattern of imagePatterns) {
    for (const match of html.matchAll(pattern)) {
      const raw = match[1].split(/\s+/)[0];
      if (!raw || raw.includes("logo") || raw.includes("icon")) continue;
      const absolute = absoluteUrl(raw);
      if (/\.(png|jpe?g|webp)(\?|$)/i.test(absolute)) {
        urls.add(absolute);
      }
    }
  }

  return [...urls].slice(0, 8);
}
