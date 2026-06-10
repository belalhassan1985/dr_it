export type Product = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  gallery: string[];
  description: string;
};

export const categories = [
  "متتمات وأدوات",
  "محمولات",
  "الصوت",
  "حقائب",
  "كيبلات",
  "الكاميرات والأمان",
  "كراسي وطاولات",
  "مكونات الحاسب الشخصي",
  "لابتوبات وحاسبات",
  "أجهزة ألعاب",
  "تخزين البيانات",
  "قبضات تحكم",
  "ألعاب",
  "الشاشات وأجهزة العرض",
  "معدات الشبكات",
  "الطباعة",
  "الأجهزة الذكية",
];

const productImages = [
  "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1587302912306-cf1ed9c33146?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1593642634367-d91a135587b5?auto=format&fit=crop&w=900&q=80",
];

export const products: Product[] = [
  {
    id: "mesh-x3",
    sku: "10712",
    name: "DR.IT Mesh AX1800 3-Pack Whole Home Wi-Fi",
    brand: "DR.IT",
    category: "معدات الشبكات",
    price: 130000,
    stock: 1,
    image: productImages[0],
    gallery: [productImages[0], productImages[2], productImages[3]],
    description: "نظام شبكات منزلي سريع بتغطية واسعة وإدارة سهلة للمنازل والمكاتب الصغيرة.",
  },
  {
    id: "router-ac1200",
    sku: "10043",
    name: "DR.IT AC1200 Dual-Band Wi-Fi Router",
    brand: "DR.IT",
    category: "معدات الشبكات",
    price: 27000,
    stock: 3,
    image: productImages[1],
    gallery: [productImages[1], productImages[0], productImages[2]],
    description: "راوتر ثنائي النطاق بتصميم عملي وأداء ثابت للبث والعمل اليومي.",
  },
  {
    id: "printer-tank",
    sku: "08521",
    name: "DR.IT Color Ink Tank Printer",
    brand: "DR.IT",
    category: "الطباعة",
    price: 188000,
    stock: 10,
    image: productImages[2],
    gallery: [productImages[2], productImages[3], productImages[4]],
    description: "طابعة مكتبية اقتصادية بحبر عالي السعة ووضوح مناسب للمستندات والصور.",
  },
  {
    id: "router-lite",
    sku: "07124",
    name: "DR.IT AC750 Wi-Fi Router",
    brand: "DR.IT",
    category: "معدات الشبكات",
    price: 22000,
    stock: 3,
    image: productImages[3],
    gallery: [productImages[3], productImages[1], productImages[0]],
    description: "راوتر مدمج للاستخدام اليومي مع إعداد سريع وثبات جيد.",
  },
  {
    id: "hdmi-40",
    sku: "03557",
    name: "DR.IT 40m HDMI 2.0 Cable",
    brand: "DR.IT",
    category: "كيبلات",
    price: 42000,
    stock: 2,
    image: productImages[4],
    gallery: [productImages[4], productImages[5], productImages[6]],
    description: "كيبل HDMI طويل لنقل الصورة والصوت بجودة عالية لغرف العرض والقاعات.",
  },
  {
    id: "laptop-sleeve",
    sku: "03665",
    name: "DR.IT Two-Colors MIX Laptop Sleeve",
    brand: "DR.IT",
    category: "حقائب",
    price: 18000,
    stock: 300,
    image: productImages[5],
    gallery: [productImages[5], productImages[6], productImages[7]],
    description: "حقيبة عملية للحاسوب المحمول بتبطين داخلي وتصميم بسيط للاستخدام اليومي.",
  },
  {
    id: "office-aio",
    sku: "04454",
    name: "DR.IT Wi-Fi AIO Office Printer",
    brand: "DR.IT",
    category: "الطباعة",
    price: 185000,
    stock: 10,
    image: productImages[6],
    gallery: [productImages[6], productImages[2], productImages[3]],
    description: "طابعة متعددة الوظائف مع اتصال Wi-Fi وتحكم سهل في مهام المكتب.",
  },
  {
    id: "display-24",
    sku: "06137",
    name: "DR.IT 24 inch IPS Full HD Monitor",
    brand: "DR.IT",
    category: "الشاشات وأجهزة العرض",
    price: 99000,
    stock: 1,
    image: productImages[7],
    gallery: [productImages[7], productImages[4], productImages[5]],
    description: "شاشة IPS بدقة Full HD مناسبة للعمل، الدراسة، والألعاب الخفيفة.",
  },
];

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US").format(price) + " IQD";
}

export function getProduct(id: string) {
  return products.find((product) => product.id === id) ?? products[0];
}
