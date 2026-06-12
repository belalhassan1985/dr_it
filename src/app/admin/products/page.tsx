import Image from "next/image";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminTable } from "@/components/admin/admin-table";
import { saveProduct, toggleProduct, uploadProductImage } from "@/lib/admin-actions";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { PAGE_SIZE } from "@/lib/admin-utils";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";

type ProductsAdminPageProps = {
  searchParams: Promise<{ page?: string; q?: string; status?: string; sort?: string }>;
};

export default async function ProductsAdminPage({ searchParams }: ProductsAdminPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const where = {
    ...(params.q ? {
      OR: [
        { nameAr: { contains: params.q, mode: "insensitive" as const } },
        { sku: { contains: params.q, mode: "insensitive" as const } },
      ],
    } : {}),
    ...(params.status === "active" ? { isActive: true } : {}),
    ...(params.status === "inactive" ? { isActive: false } : {}),
  };
  const orderBy = params.sort === "price-asc" ? { price: "asc" as const } : params.sort === "stock-asc" ? { stockQuantity: "asc" as const } : { sourceCreatedAt: "desc" as const };
  const [products, total, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { nameAr: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <AdminShell title="Products">
      <form className="admin-toolbar">
        <input name="q" defaultValue={params.q ?? ""} placeholder="بحث بالاسم أو SKU" />
        <select name="status" defaultValue={params.status ?? "active"}><option value="active">فعال</option><option value="inactive">معطل</option><option value="">كل الحالات</option></select>
        <select name="sort" defaultValue={params.sort ?? "latest"}><option value="latest">الأحدث</option><option value="price-asc">السعر الأقل</option><option value="stock-asc">المخزون الأقل</option></select>
        <button>تطبيق</button>
      </form>
      <details className="admin-form-box">
        <summary>إضافة منتج</summary>
        <ProductForm categories={categories} brands={brands} />
      </details>
      <p className="admin-muted">عدد المنتجات: {total}</p>
      <AdminTable>
        <thead><tr><th>الصورة</th><th>SKU</th><th>اسم المنتج</th><th>القسم</th><th>العلامة</th><th>السعر</th><th>المخزون</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td><Image src={product.images[0]?.url ?? "/images/NoImage.jpg"} alt="" width={54} height={54} /></td>
              <td>{product.sku}</td>
              <td>{product.nameAr}</td>
              <td>{product.category.nameAr}</td>
              <td>{product.brand.name}</td>
              <td>{formatPrice(product.price)}</td>
              <td>{product.stockQuantity}</td>
              <td>{product.isActive ? "فعال" : "معطل"}</td>
              <td>
                <details>
                  <summary>تعديل</summary>
                  <ProductForm product={product} categories={categories} brands={brands} />
                  <form action={uploadProductImage} className="admin-inline-form">
                    <input name="productId" type="hidden" value={product.id} />
                    <input name="image" type="file" accept="image/*" />
                    <button>رفع صورة</button>
                  </form>
                  <form action={toggleProduct}>
                    <input name="id" type="hidden" value={product.id} />
                    <input name="isActive" type="hidden" value={String(!product.isActive)} />
                    <button>{product.isActive ? "تعطيل" : "تفعيل"}</button>
                  </form>
                  <DeleteProductButton productId={product.id} />
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
      <AdminPager page={page} total={total} basePath="/admin/products" q={params.q} />
    </AdminShell>
  );
}

function ProductForm({ product, categories, brands }: { product?: { id: string; sku: string; nameAr: string; price: number; stockQuantity: number; categoryId: string; brandId: string; isActive: boolean }; categories: Array<{ id: string; nameAr: string }>; brands: Array<{ id: string; name: string }> }) {
  return (
    <form action={saveProduct} className="admin-edit-grid">
      <input name="id" type="hidden" value={product?.id ?? ""} />
      <input name="sku" defaultValue={product?.sku ?? ""} placeholder="SKU" />
      <input name="nameAr" defaultValue={product?.nameAr ?? ""} placeholder="اسم المنتج" />
      <input name="price" defaultValue={product?.price ?? 0} placeholder="السعر" type="number" />
      <input name="stockQuantity" defaultValue={product?.stockQuantity ?? 0} placeholder="المخزون" type="number" />
      <select name="categoryId" defaultValue={product?.categoryId}>{categories.map((category) => <option value={category.id} key={category.id}>{category.nameAr}</option>)}</select>
      <select name="brandId" defaultValue={product?.brandId}>{brands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}</select>
      <label><input name="isActive" type="checkbox" defaultChecked={product?.isActive ?? true} /> فعال</label>
      <button>حفظ</button>
    </form>
  );
}

function AdminPager({ page, total, basePath, q }: { page: number; total: number; basePath: string; q?: string }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return <div className="admin-pager"><a href={`${basePath}?page=${Math.max(1, page - 1)}${q ? `&q=${q}` : ""}`}>السابق</a><span>{page} / {totalPages}</span><a href={`${basePath}?page=${Math.min(totalPages, page + 1)}${q ? `&q=${q}` : ""}`}>التالي</a></div>;
}
