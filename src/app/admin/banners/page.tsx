import { existsSync } from "fs";
import path from "path";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminTable } from "@/components/admin/admin-table";
import { BannerForm } from "@/components/admin/banner-form";
import { DeleteBannerButton } from "@/components/admin/admin-delete-banner";
import { prisma } from "@/lib/db";
import { toApiUrl } from "@/lib/images";

type BannersAdminPageProps = {
  searchParams: Promise<{ edit?: string; success?: string }>;
};

function isValidImageUrl(url: string | null): boolean {
  if (!url) return false;
  const v = String(url).trim();
  if (!v || v === "null" || v === "undefined") return false;
  return true;
}

function imageFileExists(url: string | null): boolean {
  if (!isValidImageUrl(url)) return false;
  const v = url!;
  // New format: /api/uploads/banners/xxx → check project-root/uploads/
  if (v.startsWith("/api/uploads/")) {
    const relative = v.replace("/api/uploads/", "");
    const filePath = path.join(process.cwd(), "uploads", relative);
    if (existsSync(filePath)) return true;
  }
  // Old format: /uploads/banners/xxx → check public/uploads/
  const oldPath = path.join(process.cwd(), "public", v);
  return existsSync(oldPath);
}

export default async function BannersAdminPage({ searchParams }: BannersAdminPageProps) {
  const params = await searchParams;
  const banners = await prisma.banner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  const editBanner = params.edit ? banners.find((b) => b.id === params.edit) ?? null : null;

  const maxSortOrder = banners.reduce((max, b) => Math.max(max, b.sortOrder), -1);
  const nextSortOrder = maxSortOrder + 1;

  const successMessage = params.success === "added" ? "تمت إضافة البنر بنجاح" :
    params.success === "updated" ? "تم تحديث البنر بنجاح" :
    params.success === "deleted" ? "تم حذف البنر بنجاح" :
    null;

  return (
    <AdminShell title="Banners">
      {successMessage ? (
        <div className="banner-toast">{successMessage}</div>
      ) : null}

      <BannerForm editBanner={editBanner} nextSortOrder={nextSortOrder} />

      <AdminTable>
        <thead><tr><th>الترتيب</th><th>الصورة</th><th>العنوان</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
        <tbody>
          {banners.map((banner) => {
            const hasImage = isValidImageUrl(banner.imageUrl);
            const hasDesktop = isValidImageUrl(banner.desktopImageUrl);
            const hasMobile = isValidImageUrl(banner.mobileImageUrl);
            const fileExists = hasImage && imageFileExists(banner.imageUrl);
            const noValidImage = !hasImage && !hasDesktop && !hasMobile;
            const noFile = hasImage && !fileExists;

            return (
            <tr key={banner.id}>
              <td>{banner.sortOrder}</td>
              <td>
                {hasImage ? (
                  <div className="banner-table-preview" title={banner.imageUrl!}>
                    <img src={toApiUrl(banner.imageUrl!)} alt="" className="banner-table-preview__thumb" />
                    {hasDesktop ? <span className="banner-table-preview__badge" title={banner.desktopImageUrl!}>D</span> : null}
                    {hasMobile ? <span className="banner-table-preview__badge" title={banner.mobileImageUrl!}>M</span> : null}
                    {noFile ? <span className="banner-table-preview__badge banner-table-preview__badge--warn" title="ملف الصورة غير موجود على الخادم">404</span> : null}
                  </div>
                ) : (
                  <div className="banner-table-preview banner-table-preview--empty">
                    <span className="banner-table-preview__badge banner-table-preview__badge--warn">بلا صورة</span>
                  </div>
                )}
                {noValidImage ? <div className="banner-table-preview__warn">تنبيه: لا توجد صورة صالحة لهذا البنر</div> : null}
                {noFile ? <div className="banner-table-preview__warn">تنبيه: رابط الصورة لا يشير إلى ملف موجود على الخادم</div> : null}
              </td>
              <td>{banner.title || "بدون عنوان"}</td>
              <td>
                {banner.isActive ? "فعال" : "غير فعال"}
                {banner.isActive && noValidImage ? <span className="banner-table-preview__badge banner-table-preview__badge--warn" style={{marginRight:6}}>لا توجد صورة</span> : null}
              </td>
              <td>
                <div className="banner-table-actions">
                  <a href={`/admin/banners?edit=${banner.id}`} className="banner-table-actions__edit">تعديل</a>
                  <DeleteBannerButton bannerId={banner.id} />
                </div>
              </td>
            </tr>
            );
          })}
          {banners.length === 0 ? <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--muted)" }}>لا توجد banners بعد</td></tr> : null}
        </tbody>
      </AdminTable>
    </AdminShell>
  );
}
