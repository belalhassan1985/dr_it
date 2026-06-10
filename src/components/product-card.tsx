import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatPrice, type StoreProduct } from "@/lib/products";

type ProductCardProps = {
  product: StoreProduct;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="product-card">
      <div className="image-stage">
        <Link href={`/product/${product.id}`} aria-label={product.name}>
          <Image src={product.image} alt={product.name} fill sizes="(max-width: 820px) 50vw, 25vw" />
        </Link>
        <div className="card-overlay">
          <AddToCartButton productId={product.id} iconSize={16} />
        </div>
      </div>
      <div className="card-body">
        <p>SKU Code : {product.sku}</p>
        <span>في المخزون : {product.stock} فقط</span>
        <Link href={`/product/${product.id}`}>{product.name}</Link>
        <strong>{formatPrice(product.price)}</strong>
      </div>
    </article>
  );
}
