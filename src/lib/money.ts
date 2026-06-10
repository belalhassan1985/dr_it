export const TAX_RATE = 0.05;

export function calculateTax(subtotal: number) {
  return Math.round(subtotal * TAX_RATE);
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US").format(price) + " IQD";
}
