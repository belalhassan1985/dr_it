import QRCode from "qrcode";

type InvoiceQRProps = {
  orderId: string;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dr-it.store";

export async function InvoiceQR({ orderId }: InvoiceQRProps) {
  const url = `${SITE_URL}/order-confirmation/${orderId}`;

  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 160,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });

  return (
    <div className="invoice-qr">
      <img src={qrDataUrl} alt="QR Code" width={160} height={160} className="invoice-qr-img" />
      <p className="invoice-qr-label">امسح للتحقق من الفاتورة</p>
    </div>
  );
}
