import Link from "next/link";
import { formatPrice, getSalePrice, hasSale, SaleFields } from "@/lib/sales";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  tags: string[];
  average_rating?: number;
  review_count?: number;
} & SaleFields;

export default function ProductCard({
  product,
  quantity,
  onQuantityChange,
}: {
  product: Product;
  quantity: number;
  onQuantityChange: (product: Product, quantity: number) => void;
}) {
  const isOnSale = hasSale(product);
  const currentPrice = isOnSale ? getSalePrice(product.price, product.discount_percentage) : product.price;
  const cartProduct = { ...product, price: currentPrice };
  const reviewCount = product.review_count || 0;
  const averageRating = product.average_rating || 0;

  return (
    <article className="product-card">
      <Link className="product-card-link" href={`/products/${product.id}`} aria-label={`View details for ${product.name}`}>
        <div className="product-image-wrap">
          {isOnSale && <span className="sale-pill">{product.sale_name}</span>}
          {product.image_url ? <img src={product.image_url} alt={product.name} loading="lazy" /> : <div className="empty-state">No image available</div>}
        </div>
        <div>
          <h2>{product.name}</h2>
          {reviewCount > 0 && (
            <div className="product-rating" aria-label={`${averageRating.toFixed(1)} out of 5 from ${reviewCount} reviews`}>
              <span>{"★".repeat(Math.max(1, Math.round(averageRating)))}</span>
              <small>{averageRating.toFixed(1)} · {reviewCount} {reviewCount === 1 ? "review" : "reviews"}</small>
            </div>
          )}
          {product.description && <p className="product-description">{product.description}</p>}
        </div>
      </Link>
      <div className="product-meta">
        <span className="product-price">
          {isOnSale && <del>₹{formatPrice(product.price)}</del>}
          <strong>₹{formatPrice(currentPrice)}</strong>
        </span>
        {quantity === 0 ? (
          <button className="add-button" onClick={() => onQuantityChange(cartProduct, 1)}>Add to bag</button>
        ) : (
          <div className="quantity-control">
            <button onClick={() => onQuantityChange(cartProduct, quantity - 1)} aria-label="Decrease quantity">−</button>
            <strong>{quantity}</strong>
            <button onClick={() => onQuantityChange(cartProduct, quantity + 1)} aria-label="Increase quantity">+</button>
          </div>
        )}
      </div>
    </article>
  );
}
