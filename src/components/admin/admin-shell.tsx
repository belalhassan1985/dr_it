import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/session";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/settings#whatsapp", label: "WhatsApp" },
  { href: "/admin/sync", label: "Sync" },
  { href: "/admin/health", label: "Health" },
];

export async function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  try {
    await requireAdminUser();
  } catch {
    redirect("/admin/login");
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-logo" href="/admin">DR.IT</Link>
        <nav>
          {links.map((link) => (
            <Link href={link.href} key={link.href}>{link.label}</Link>
          ))}
        </nav>
      </aside>
      <section className="admin-main">
        <header className="admin-header">
          <div>
            <p>DR.IT Technology & Trading</p>
            <h1>{title}</h1>
          </div>
          <Link href="/">المتجر</Link>
        </header>
        {children}
      </section>
    </main>
  );
}
