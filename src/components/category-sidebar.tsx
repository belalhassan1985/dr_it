import Link from "next/link";

type CategorySidebarProps = {
  categories: Array<{
    name: string;
    slug: string;
  }>;
};

export function CategorySidebar({ categories }: CategorySidebarProps) {
  return (
    <aside className="category-sidebar">
      <h2>تصفح الأقسام</h2>
      {categories.map((category) => (
        <Link href={`/categories/${encodeURIComponent(category.slug)}`} key={category.slug}>{category.name}</Link>
      ))}
    </aside>
  );
}
