"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";
import { assertAdminAccess } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { parseIntField, slugify } from "@/lib/admin-utils";
import { runAnasImport } from "@/lib/import/anas-importer";

export async function saveProduct(formData: FormData) {
  await assertAdminAccess();
  const id = String(formData.get("id") ?? "");
  const nameAr = String(formData.get("nameAr") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const brandId = String(formData.get("brandId") ?? "");
  const price = parseIntField(formData.get("price"));
  const stockQuantity = parseIntField(formData.get("stockQuantity"));
  const isActive = formData.get("isActive") === "on";

  if (!nameAr || !sku || !categoryId || !brandId) return;

  if (id) {
    await prisma.product.update({
      where: { id },
      data: { nameAr, nameEn: nameAr, sku, categoryId, brandId, price, stockQuantity, isActive },
    });
  } else {
    await prisma.product.create({
      data: { nameAr, nameEn: nameAr, sku, categoryId, brandId, price, stockQuantity, isActive },
    });
  }

  revalidatePath("/admin/products");
}

export async function toggleProduct(formData: FormData) {
  await assertAdminAccess();
  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("isActive") === "true";
  if (!id) return;
  await prisma.product.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/products");
}

export async function uploadProductImage(formData: FormData) {
  await assertAdminAccess();
  const productId = String(formData.get("productId") ?? "");
  const file = formData.get("image");
  if (!productId || !(file instanceof File) || file.size === 0) return;
  if (file.size > 5 * 1024 * 1024) throw new Error("Image is too large");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Unsupported image type");

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  if (!["jpg", "jpeg", "png", "webp"].includes(extension)) throw new Error("Unsupported image extension");
  const productExists = await prisma.product.count({ where: { id: productId } });
  if (!productExists) throw new Error("Product not found");
  const fileName = `${productId}-${Date.now()}.${extension}`;
  const targetDir = path.join(process.cwd(), "public", "products");
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, fileName), Buffer.from(await file.arrayBuffer()));

  const count = await prisma.productImage.count({ where: { productId } });
  await prisma.productImage.create({
    data: { productId, url: `/products/${fileName}`, alt: file.name, sortOrder: count },
  });
  revalidatePath("/admin/products");
}

export async function saveCategory(formData: FormData) {
  await assertAdminAccess();
  const id = String(formData.get("id") ?? "");
  const nameAr = String(formData.get("nameAr") ?? "").trim();
  const sortOrder = parseIntField(formData.get("sortOrder"));
  const isActive = formData.get("isActive") === "on";
  if (!nameAr) return;

  if (id) {
    await prisma.category.update({ where: { id }, data: { nameAr, nameEn: nameAr, sortOrder, isActive } });
  } else {
    await prisma.category.create({ data: { nameAr, nameEn: nameAr, slug: slugify(nameAr), sortOrder, isActive } });
  }
  revalidatePath("/admin/categories");
}

export async function saveBrand(formData: FormData) {
  await assertAdminAccess();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const isActive = formData.get("isActive") === "on";
  if (!name) return;

  if (id) {
    await prisma.brand.update({ where: { id }, data: { name, isActive } });
  } else {
    await prisma.brand.create({ data: { name, slug: slugify(name), isActive } });
  }
  revalidatePath("/admin/brands");
}

export async function updateOrderStatus(formData: FormData) {
  await assertAdminAccess();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !Object.values(OrderStatus).includes(status as OrderStatus)) return;
  await prisma.order.update({ where: { id }, data: { status: status as OrderStatus } });
  revalidatePath("/admin/orders");
}

export async function saveSettings(formData: FormData) {
  await assertAdminAccess();
  const keys = ["site.name", "site.description", "tax.rate", "company.phone", "company.whatsapp", "company.email", "company.address", "store.status"];
  for (const key of keys) {
    const value = String(formData.get(key) ?? "");
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  revalidatePath("/admin/settings");
}

export async function runAnasSync() {
  await assertAdminAccess();
  const result = await runAnasImport();
  revalidatePath("/admin/sync");
  if (result.status === "failed") {
    throw new Error(result.error || "Sync failed unexpectedly");
  }
}
