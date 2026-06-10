import { AdminShell } from "@/components/admin/admin-shell";
import { AdminTable } from "@/components/admin/admin-table";
import { saveBrand } from "@/lib/admin-actions";
import { prisma } from "@/lib/db";

export default async function BrandsAdminPage() {
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <AdminShell title="Brands">
      <details className="admin-form-box" open><summary>إضافة علامة</summary><BrandForm /></details>
      <AdminTable>
        <thead><tr><th>العلامة</th><th>عدد المنتجات</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
        <tbody>{brands.map((brand) => (
          <tr key={brand.id}>
            <td>{brand.name}</td>
            <td>{brand._count.products}</td>
            <td>{brand.isActive ? "فعال" : "معطل"}</td>
            <td><details><summary>تعديل</summary><BrandForm brand={brand} /></details></td>
          </tr>
        ))}</tbody>
      </AdminTable>
    </AdminShell>
  );
}

function BrandForm({ brand }: { brand?: { id: string; name: string; isActive: boolean } }) {
  return (
    <form action={saveBrand} className="admin-edit-grid">
      <input name="id" type="hidden" value={brand?.id ?? ""} />
      <input name="name" defaultValue={brand?.name ?? ""} placeholder="اسم العلامة" />
      <label><input name="isActive" type="checkbox" defaultChecked={brand?.isActive ?? true} /> فعال</label>
      <button>حفظ</button>
    </form>
  );
}
