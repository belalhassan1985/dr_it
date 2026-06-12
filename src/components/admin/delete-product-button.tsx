"use client";

import { useRouter } from "next/navigation";
import { deleteProduct } from "@/lib/admin-actions";

type DeleteProductButtonProps = {
  productId: string;
};

export function DeleteProductButton({ productId }: DeleteProductButtonProps) {
  const router = useRouter();

  async function handleAction(formData: FormData) {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    await deleteProduct(formData);
    router.refresh();
  }

  return (
    <form action={handleAction}>
      <input name="id" type="hidden" value={productId} />
      <button className="admin-btn-danger">حذف</button>
    </form>
  );
}
