import Link from "next/link";

type EntityGridProps = {
  items: Array<{
    name: string;
    href: string;
    count: number;
  }>;
};

export function EntityGrid({ items }: EntityGridProps) {
  return (
    <div className="entity-grid">
      {items.map((item) => (
        <Link className="entity-card" href={item.href} key={item.href}>
          <strong>{item.name}</strong>
          <span>{item.count} منتج</span>
        </Link>
      ))}
    </div>
  );
}
