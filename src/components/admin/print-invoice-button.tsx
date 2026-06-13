"use client";

export function PrintInvoiceButton() {
  return (
    <button type="button" onClick={() => window.print()} className="invoice-print-btn">
      🖨️ طباعة الفاتورة
    </button>
  );
}
