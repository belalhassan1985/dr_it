"use client";

import { useRouter } from "next/navigation";
import { deleteBanner } from "@/lib/admin-actions";

type Props = {
  bannerId: string;
};

export function DeleteBannerButton({ bannerId }: Props) {
  const router = useRouter();

  async function handleDelete() {
    const formData = new FormData();
    formData.set("id", bannerId);
    const result = await deleteBanner(formData);
    if (!result || !result.success) {
      alert(result?.message || "فشل الحذف");
    } else {
      router.push("/admin/banners?success=deleted");
      router.refresh();
    }
  }

  return (
    <button type="button" className="banner-table-actions__delete" onClick={handleDelete}>
      حذف
    </button>
  );
}
