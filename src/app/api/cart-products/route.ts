import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toApiUrl } from "@/lib/images";

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get("ids")?.split(",").filter(Boolean) ?? [];

  if (ids.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: ids },
      isActive: true,
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  return NextResponse.json({
    products: products.map((product) => ({
      id: product.id,
      sku: product.sku,
      name: product.nameAr || product.nameEn || product.sku,
      price: product.price,
      stock: product.stockQuantity,
      image: toApiUrl(product.images[0]?.url ?? "/images/NoImage.jpg"),
    })),
  });
}
