"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

type CategorySidebarProps = {
  categories: Array<{
    name: string;
    slug: string;
  }>;
};

export function CategorySidebar({ categories }: CategorySidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside className="category-sidebar">
      <button className="category-sidebar-toggle" type="button" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
        <span>تصفح الأقسام</span>
        <ChevronDown size={16} className={`toggle-icon${isOpen ? " open" : ""}`} />
      </button>
      <div className="category-sidebar-head">
        <h2>تصفح الأقسام</h2>
      </div>
      <div className={`category-sidebar-links${isOpen ? " open" : ""}`}>
        {categories.map((category) => (
          <Link href={`/categories/${encodeURIComponent(category.slug)}`} key={category.slug} onClick={() => setIsOpen(false)}>{category.name}</Link>
        ))}
      </div>
    </aside>
  );
}
