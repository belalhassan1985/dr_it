import Link from "next/link";

type PaginationProps = {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
};

export function Pagination({ page, totalPages, basePath, searchParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPageList(page, totalPages);

  return (
    <nav className="pagination" aria-label="Pagination">
      <Link className={page <= 1 ? "disabled" : ""} href={hrefFor(basePath, searchParams, Math.max(1, page - 1))}>
        السابق
      </Link>
      {pages.map((item, index) =>
        item === "gap" ? (
          <span className="pagination-gap" key={`${item}-${index}`}>...</span>
        ) : (
          <Link className={item === page ? "active" : ""} href={hrefFor(basePath, searchParams, item)} key={item}>
            {item}
          </Link>
        ),
      )}
      <Link className={page >= totalPages ? "disabled" : ""} href={hrefFor(basePath, searchParams, Math.min(totalPages, page + 1))}>
        التالي
      </Link>
    </nav>
  );
}

function hrefFor(basePath: string, params: Record<string, string | undefined>, page: number) {
  const nextParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") nextParams.set(key, value);
  }

  nextParams.set("page", String(page));
  return `${basePath}?${nextParams.toString()}`;
}

function buildPageList(page: number, totalPages: number) {
  const result: Array<number | "gap"> = [];

  for (let current = 1; current <= totalPages; current += 1) {
    const shouldShow = current === 1 || current === totalPages || Math.abs(current - page) <= 1;
    if (shouldShow) {
      result.push(current);
    } else if (result[result.length - 1] !== "gap") {
      result.push("gap");
    }
  }

  return result;
}
