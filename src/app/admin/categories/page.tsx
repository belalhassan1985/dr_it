import { AdminShell } from "@/components/admin/admin-shell";
import { AdminTable } from "@/components/admin/admin-table";
import { saveCategory } from "@/lib/admin-actions";
import { prisma } from "@/lib/db";

export default async function CategoriesAdminPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: [{ sortOrder: "asc" }, { nameAr: "asc" }],
  });

  return (
    <AdminShell title="Categories">
      <details className="admin-form-box" open><summary>إضافة قسم</summary><CategoryForm /></details>
      <AdminTable>
        <thead><tr><th>القسم</th><th>عدد المنتجات</th><th>ترتيب الظهور</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
        <tbody>{categories.map((category) => (
          <tr key={category.id}>
            <td>{category.nameAr}</td>
            <td>{category._count.products}</td>
            <td>{category.sortOrder}</td>
            <td>{category.isActive ? "فعال" : "معطل"}</td>
            <td><details><summary>تعديل</summary><CategoryForm category={category} /></details></td>
          </tr>
        ))}</tbody>
      </AdminTable>
    </AdminShell>
  );
}

function CategoryForm({ category }: { category?: { id: string; nameAr: string; sortOrder: number; isActive: boolean } }) {
  return (
    <form action={saveCategory} className="admin-edit-grid">
      <input name="id" type="hidden" value={category?.id ?? ""} />
      <input name="nameAr" defaultValue={category?.nameAr ?? ""} placeholder="اسم القسم" />
      <input name="sortOrder" defaultValue={category?.sortOrder ?? 0} type="number" placeholder="ترتيب الظهور" />
      <label><input name="isActive" type="checkbox" defaultChecked={category?.isActive ?? true} /> فعال</label>
      <button>حفظ</button>
    </form>
  );
}
