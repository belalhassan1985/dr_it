import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { calculateTax } from "@/lib/money";
import { sendOrderWhatsApp } from "@/lib/whatsapp-service";

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "الاسم مطلوب").max(120, "الاسم طويل جدا"),
  customerPhone: z.string().trim().min(7, "رقم الهاتف مطلوب").max(32, "رقم الهاتف طويل جدا"),
  address: z.string().trim().min(5, "العنوان مطلوب").max(500, "العنوان طويل جدا"),
  notes: z.string().trim().max(1000, "الملاحظات طويلة جدا").optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(999),
  })).min(1, "لا يمكن إرسال طلب فارغ").max(50, "عدد المنتجات في الطلب كبير جدا"),
});

const checkoutHits = new Map<string, number[]>();

export async function POST(request: Request) {
  if (!allowRequest(request)) {
    return NextResponse.json({ error: "طلبات كثيرة جدا، حاول لاحقا" }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات الطلب غير صحيحة" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات الطلب غير صحيحة" }, { status: 400 });
  }

  const data = parsed.data;
  const user = await getCurrentUser();
  const normalizedItems = mergeItems(data.items);

  try {
    const order = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: {
          id: { in: normalizedItems.map((item) => item.productId) },
          isActive: true,
        },
      });

      if (products.length !== normalizedItems.length) {
        throw new CheckoutError("بعض المنتجات غير متوفرة حاليا");
      }

      for (const item of normalizedItems) {
        const product = products.find((candidate) => candidate.id === item.productId);
        if (!product || item.quantity > product.stockQuantity) {
          throw new CheckoutError(`الكمية المطلوبة غير متوفرة للمنتج: ${product?.nameAr ?? item.productId}`);
        }
      }

      const subtotal = normalizedItems.reduce((sum, item) => {
        const product = products.find((candidate) => candidate.id === item.productId);
        return sum + (product?.price ?? 0) * item.quantity;
      }, 0);
      const tax = calculateTax(subtotal);
      const total = subtotal + tax;

      for (const item of normalizedItems) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stockQuantity: { gte: item.quantity },
          },
          data: {
            stockQuantity: { decrement: item.quantity },
          },
        });

        if (updated.count !== 1) {
          const product = products.find((candidate) => candidate.id === item.productId);
          throw new CheckoutError(`المخزون تغير للمنتج: ${product?.nameAr ?? item.productId}`);
        }
      }

      return tx.order.create({
        data: {
          orderNo: nextOrderNo(),
          userId: user?.id,
          customerName: data.customerName,
          customerEmail: user?.email,
          customerPhone: data.customerPhone,
          address: data.address,
          notes: data.notes,
          subtotal,
          tax,
          total,
          items: {
            create: normalizedItems.map((item) => {
              const product = products.find((candidate) => candidate.id === item.productId);
              if (!product) throw new CheckoutError("منتج غير متوفر");
              return {
                productId: product.id,
                sku: product.sku,
                name: product.nameAr || product.nameEn || product.sku,
                price: product.price,
                quantity: item.quantity,
                total: product.price * item.quantity,
              };
            }),
          },
        },
        select: {
          id: true,
          orderNo: true,
          customerName: true,
          customerPhone: true,
          total: true,
          status: true,
          items: {
            select: { name: true, sku: true, price: true, quantity: true, total: true },
          },
        },
      });
    });

    sendOrderWhatsApp({
      id: order.id,
      orderNo: order.orderNo,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      total: order.total,
      status: order.status,
      items: order.items,
    }).catch((err) => console.error("[checkout] whatsapp send error:", err));

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "تعذر إنشاء الطلب" }, { status: 500 });
  }
}

function mergeItems(items: Array<{ productId: string; quantity: number }>) {
  const merged = new Map<string, number>();

  for (const item of items) {
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
  }

  return [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

function nextOrderNo() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DRIT-${timestamp}-${random}`;
}

function allowRequest(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = forwardedFor || request.headers.get("x-real-ip") || "local";
  const now = Date.now();
  const windowMs = 60_000;
  const hits = (checkoutHits.get(key) ?? []).filter((hit) => now - hit < windowMs);
  if (hits.length >= 12) return false;
  hits.push(now);
  checkoutHits.set(key, hits);
  return true;
}

class CheckoutError extends Error {}
