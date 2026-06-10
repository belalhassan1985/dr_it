import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="breadcrumb" aria-label="مسار الصفحة">
      <Link href="/">الرئيسية</Link>
      {items.map((item) => (
        item.href ? (
          <Link href={item.href} key={item.label}>{item.label}</Link>
        ) : (
          <span key={item.label}>{item.label}</span>
        )
      ))}
    </nav>
  );
}
