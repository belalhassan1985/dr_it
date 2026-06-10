"use client";

import { useState } from "react";
import Image from "next/image";
import { Minus, Plus, Share2, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { formatPrice } from "@/lib/money";

type ProductDetailProps = {
  id: string;
  name: string;
  price: number;
  sku: string;
  brand: string;
  stock: number;
  image: string;
  gallery: string[];
  description?: string;
};

export function ProductDetailClient({
  id,
  name,
  price,
  sku,
  brand,
  stock,
  image,
  gallery,
  description,
}: ProductDetailProps) {
  const { addItem, openCartDrawer } = useCart();
  const [selectedImage, setSelectedImage] = useState(image);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const outOfStock = stock <= 0;

  function changeQuantity(delta: number) {
    setQuantity((q) => Math.max(1, Math.min(q + delta, stock)));
  }

  function handleAddToCart() {
    if (outOfStock) return;
    addItem(id, quantity);
    setAdded(true);
    openCartDrawer();
    setTimeout(() => setAdded(false), 2500);
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: name, url: window.location.href }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  return (
    <>
      <section className="product-detail">
        {gallery.length > 1 ? (
          <aside className="thumbs" aria-label="صور المنتج">
            {gallery.map((img) => (
              <button
                key={img}
                type="button"
                className={selectedImage === img ? "selected" : ""}
                onClick={() => setSelectedImage(img)}
              >
                <Image src={img} alt="" width={80} height={80} />
              </button>
            ))}
          </aside>
        ) : null}
        <div className="main-photo">
          <Image src={selectedImage} alt={name} width={680} height={680} priority />
        </div>
        <div className="product-info">
          <h1>{name}</h1>
          <strong className="detail-price">{formatPrice(price)}</strong>
          <p>رقم المنتج : <b>{sku}</b></p>
          <p>العلامة التجارية : <b>{brand}</b></p>
          <p>
            حالة المخزون :{" "}
            {outOfStock ? (
              <b className="out-of-stock">غير متوفر</b>
            ) : stock <= 5 ? (
              <b className="low-stock">متبقي {stock} فقط</b>
            ) : (
              <b className="in-stock">متوفر</b>
            )}
          </p>
          {outOfStock ? null : (
            <div className="quantity-row">
              <span>الكمية :</span>
              <button type="button" onClick={() => changeQuantity(1)} aria-label="زيادة" disabled={quantity >= stock}><Plus size={20} /></button>
              <div className="quantity-select">{quantity}</div>
              <button type="button" onClick={() => changeQuantity(-1)} aria-label="إنقاص" disabled={quantity <= 1}><Minus size={20} /></button>
            </div>
          )}
          <button
            className="wide-cart"
            type="button"
            disabled={outOfStock}
            onClick={handleAddToCart}
          >
            <ShoppingCart size={20} />
            {outOfStock ? "غير متوفر حالياً" : added ? "تمت الإضافة ✓" : "إضافة إلى عربة التسوق"}
          </button>
          <button className="share" type="button" onClick={handleShare}>
            <Share2 size={20} /> مشاركة
          </button>
        </div>
      </section>
      {description ? (
        <section className="tabs">
          <nav>
            <a className="active">وصف</a>
          </nav>
          <p>{description}</p>
        </section>
      ) : null}
    </>
  );
}