type StoreFiltersProps = {
  basePath: string;
  searchParams?: Record<string, string | undefined>;
  showSearch?: boolean;
  queryPlaceholder?: string;
};

export function StoreFilters({
  basePath,
  searchParams = {},
  showSearch = false,
  queryPlaceholder = "بحث",
}: StoreFiltersProps) {
  return (
    <form className="store-filters" action={basePath}>
      {showSearch ? (
        <input name="q" defaultValue={searchParams.q ?? ""} placeholder={queryPlaceholder} />
      ) : null}
      <button type="submit">تطبيق</button>
      <label className="available-filter">
        <input name="available" value="1" type="checkbox" defaultChecked={searchParams.available === "1"} />
        المتوفر فقط
      </label>
      <select name="sort" defaultValue={searchParams.sort ?? "latest"} aria-label="ترتيب المنتجات">
        <option value="latest">الأحدث</option>
        <option value="price-asc">السعر من الأقل إلى الأعلى</option>
        <option value="price-desc">السعر من الأعلى إلى الأقل</option>
      </select>
    </form>
  );
}
