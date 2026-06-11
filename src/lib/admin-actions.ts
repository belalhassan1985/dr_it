"use server";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
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
  revalidatePath("/");
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
  const targetDir = path.join(process.cwd(), "uploads", "products");
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, fileName), Buffer.from(await file.arrayBuffer()));

  const count = await prisma.productImage.count({ where: { productId } });
  await prisma.productImage.create({
    data: { productId, url: `/api/uploads/products/${fileName}`, alt: file.name, sortOrder: count },
  });
  revalidatePath("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  await assertAdminAccess();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("لم يتم تحديد المنتج.");

  const orderCount = await prisma.orderItem.count({ where: { productId: id } });
  if (orderCount > 0) {
    throw new Error("لا يمكن حذف منتج مرتبط بطلبات سابقة، يمكنك تعطيله بدلاً من الحذف.");
  }

  const images = await prisma.productImage.findMany({ where: { productId: id }, select: { url: true } });

  await prisma.cartItem.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });

  const uploadsDir = path.join(process.cwd(), "uploads", "products");
  for (const img of images) {
    const relative = img.url.replace("/api/uploads/products/", "");
    const filePath = path.join(uploadsDir, relative);
    if (existsSync(filePath)) {
      try { await unlink(filePath); } catch { /* skip */ }
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
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

async function saveUploadedFile(file: File, prefix: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  if (!["jpg", "jpeg", "png", "webp"].includes(ext)) throw new Error("Unsupported file extension");
  if (file.size > 3 * 1024 * 1024) throw new Error("File is too large (max 3MB)");
  const safeName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  // Save to project-root/uploads/ (outside public/, survives redeploy with persistent volume)
  const dir = path.join(process.cwd(), "uploads", "banners");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safeName), Buffer.from(await file.arrayBuffer()));
  return `/api/uploads/banners/${safeName}`;
}

function resolveImageField(value: FormDataEntryValue | null, prefix: string): Promise<string | null> {
  if (!value) return Promise.resolve(null);
  if (typeof value === "string") {
    const trimmed = value.trim();
    return Promise.resolve(trimmed || null);
  }
  if (value instanceof File && value.size > 0) {
    return saveUploadedFile(value, prefix);
  }
  return Promise.resolve(null);
}

export async function saveBanner(formData: FormData) {
  try {
    await assertAdminAccess();
  } catch {
    return { success: false, message: "صلاحية الوصول منتهية. الرجاء تسجيل الدخول مرة أخرى." };
  }

  const id = String(formData.get("id") ?? "");

  const existingImageUrl = String(formData.get("existingImageUrl") ?? "") || null;
  const existingDesktopImageUrl = String(formData.get("existingDesktopImageUrl") ?? "") || null;
  const existingMobileImageUrl = String(formData.get("existingMobileImageUrl") ?? "") || null;

  let imageUrl: string | null | undefined;
  let desktopImageUrl: string | null | undefined;
  let mobileImageUrl: string | null | undefined;

  try {
    imageUrl = await resolveImageField(formData.get("imageUrl"), "banner");
    desktopImageUrl = await resolveImageField(formData.get("desktopImageUrl"), "banner-desktop");
    mobileImageUrl = await resolveImageField(formData.get("mobileImageUrl"), "banner-mobile");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("too large")) return { success: false, message: "حجم الصورة كبير جداً. الحد الأقصى 3 ميغابايت." };
    if (msg.includes("extension") || msg.includes("type")) return { success: false, message: "نوع الملف غير مدعوم. يُقبل JPG و PNG و WebP فقط." };
    console.error("[saveBanner] upload error:", err);
    return { success: false, message: "فشل رفع الصورة. تحقق من حجم الملف ونوعه." };
  }

  if (!imageUrl && existingImageUrl) imageUrl = existingImageUrl;
  if (!desktopImageUrl && existingDesktopImageUrl) desktopImageUrl = existingDesktopImageUrl;
  if (!mobileImageUrl && existingMobileImageUrl) mobileImageUrl = existingMobileImageUrl;

  imageUrl = imageUrl || null;
  desktopImageUrl = desktopImageUrl || null;
  mobileImageUrl = mobileImageUrl || null;

  if (!imageUrl) return { success: false, message: "يجب اختيار صورة رئيسية للـ Banner." };

  const title = String(formData.get("title") ?? "").trim() || null;
  const subtitle = String(formData.get("subtitle") ?? "").trim() || null;
  const linkUrl = String(formData.get("linkUrl") ?? "").trim() || null;
  const buttonText = String(formData.get("buttonText") ?? "").trim() || null;
  const sortOrder = parseIntField(formData.get("sortOrder"));
  const isActive = formData.get("isActive") === "on";

  const data = { title, subtitle, imageUrl, desktopImageUrl, mobileImageUrl, linkUrl, buttonText, sortOrder, isActive };

  try {
    if (id) {
      await prisma.banner.update({ where: { id }, data });
    } else {
      await prisma.banner.create({ data });
    }
  } catch (err) {
    console.error("[saveBanner] db error:", err);
    return { success: false, message: "حدث خطأ أثناء حفظ البنر. الرجاء المحاولة مرة أخرى." };
  }

  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { success: true, message: id ? "تم تحديث البنر بنجاح" : "تمت إضافة البنر بنجاح", isEdit: !!id };
}

export async function deleteBanner(formData: FormData) {
  try {
    await assertAdminAccess();
  } catch {
    return { success: false, message: "صلاحية الوصول منتهية. الرجاء تسجيل الدخول مرة أخرى." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { success: false, message: "لم يتم تحديد البنر." };
  }

  try {
    await prisma.banner.delete({ where: { id } });
  } catch (err) {
    console.error("[deleteBanner] db error:", err);
    return { success: false, message: "حدث خطأ أثناء حذف البنر." };
  }

  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { success: true, message: "تم حذف البنر بنجاح" };
}

const WHATSAPP_SETTINGS_KEYS = [
  "whatsapp.enabled",
  "whatsapp.template",
  "whatsapp.store_whatsapp",
];

const WAHA_SETTINGS_KEYS = [
  "waha.base_url",
  "waha.session_name",
  "waha.api_key",
];

export async function saveWhatsappSettings(formData: FormData): Promise<{ success: boolean; message: string }> {
  await assertAdminAccess();
  for (const key of [...WHATSAPP_SETTINGS_KEYS, ...WAHA_SETTINGS_KEYS]) {
    let value = String(formData.get(key) ?? "");
    // Skip empty api_key to preserve existing value
    if (key === "waha.api_key" && !value) continue;
    // Normalize checkbox: checked="on" → "true", unchecked → "false"
    if (key === "whatsapp.enabled") {
      value = formData.get(key) === "on" ? "true" : "false";
    }
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  revalidatePath("/admin/settings");
  return { success: true, message: "تم حفظ إعدادات واتساب بنجاح" };
}

export async function wahaStartSessionAction() {
  await assertAdminAccess();
  const { wahaStartSession } = await import("@/lib/whatsapp-service");
  const result = await wahaStartSession();
  revalidatePath("/admin/settings");
  return result;
}

export async function wahaGetQRAction() {
  await assertAdminAccess();
  const { wahaGetQR } = await import("@/lib/whatsapp-service");
  return wahaGetQR();
}

export async function wahaGetStatusAction() {
  await assertAdminAccess();
  const { wahaGetStatus } = await import("@/lib/whatsapp-service");
  const result = await wahaGetStatus();
  revalidatePath("/admin/settings");
  return result;
}

export async function wahaLogoutAction() {
  await assertAdminAccess();
  const { wahaLogout } = await import("@/lib/whatsapp-service");
  const result = await wahaLogout();
  revalidatePath("/admin/settings");
  return result;
}

export async function savePaymentAccount(formData: FormData): Promise<{ success: boolean; message: string }> {
  await assertAdminAccess();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const accountNumber = String(formData.get("accountNumber") ?? "").trim();
  const accountHolder = String(formData.get("accountHolder") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const isActive = formData.get("isActive") === "on";
  const isDefault = formData.get("isDefault") === "on";
  const sortOrder = parseIntField(formData.get("sortOrder"));

  if (!name || !accountNumber) {
    return { success: false, message: "اسم الحساب ورقم الحساب مطلوبان" };
  }

  if (isDefault) {
    await prisma.paymentAccount.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
  }

  if (id) {
    await prisma.paymentAccount.update({ where: { id }, data: { name, accountNumber, accountHolder, notes, isActive, isDefault, sortOrder } });
  } else {
    await prisma.paymentAccount.create({ data: { name, accountNumber, accountHolder, notes, isActive, isDefault, sortOrder } });
  }

  revalidatePath("/admin/settings");
  return { success: true, message: id ? "تم تحديث الحساب بنجاح" : "تمت إضافة الحساب بنجاح" };
}

export async function deletePaymentAccount(formData: FormData) {
  await assertAdminAccess();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.paymentAccount.delete({ where: { id } });
  revalidatePath("/admin/settings");
}

export async function wahaResetSessionAction() {
  await assertAdminAccess();
  const { wahaResetSession } = await import("@/lib/whatsapp-service");
  const result = await wahaResetSession();
  revalidatePath("/admin/settings");
  return result;
}

export async function sendTestWhatsApp(formData: FormData) {
  await assertAdminAccess();
  const phone = String(formData.get("testPhone") ?? "").trim();
  const { sendTestMessage } = await import("@/lib/whatsapp-service");
  return sendTestMessage(phone);
}
