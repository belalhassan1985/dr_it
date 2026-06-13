export function calculateTax(subtotal: number, rate: number) {
  return Math.round(subtotal * rate);
}

export function parseTaxRate(raw: string | number | undefined | null): number {
  if (raw === undefined || raw === null || raw === "") return 0.05;
  const num = typeof raw === "string" ? Number(raw) : raw;
  if (!Number.isFinite(num) || num < 0) return 0.05;
  if (num > 1) return num / 100;
  return num;
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US").format(price) + " IQD";
}
