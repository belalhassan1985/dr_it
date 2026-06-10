import Link from "next/link";
import { Header } from "@/components/header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="listing-page">
        <div className="empty-state">
          <h2>404 - الصفحة غير موجودة</h2>
          <p>الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
          <Link className="checkout-link" href="/" style={{ marginTop: 16 }}>العودة إلى المتجر</Link>
        </div>
      </main>
    </>
  );
}