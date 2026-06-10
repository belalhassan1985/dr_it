import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { CartProvider } from "@/components/cart-context";
import { CartToast } from "@/components/cart-toast";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DR.IT | متجر التقنية الذكية",
    template: "%s | DR.IT",
  },
  description: "تسوق أفضل المنتجات التقنية في متجر DR.IT - شبكات، طباعة، شاشات، واكسسوارات العمل الذكي.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://dr-it.store"),
  openGraph: {
    title: "DR.IT | متجر التقنية الذكية",
    description: "تسوق أفضل المنتجات التقنية في متجر DR.IT - شبكات، طباعة، شاشات، واكسسوارات العمل الذكي.",
    siteName: "DR.IT",
    type: "website",
    locale: "ar_IQ",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body>
        <CartProvider>
          {children}
          <CartToast />
        </CartProvider>
      </body>
    </html>
  );
}