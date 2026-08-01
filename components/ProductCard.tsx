type Product = { id: string; name: string; description: string | null; price: number; image_url: string | null; tags: string[]; };

export default function ProductCard({ product, quantity, onQuantityChange }: { product: Product; quantity: number; onQuantityChange: (product: Product, quantity: number) => void; }) {
  return <article className="product-card">
    <div className="product-image-wrap">{product.image_url ? <img src={product.image_url} alt={product.name} loading="lazy" /> : <div className="empty-state">No image available</div>}</div>
    <div><h2>{product.name}</h2>{product.description && <p className="product-description">{product.description}</p>}</div>
    <div className="product-meta"><span className="product-price">₹{product.price}</span>{quantity === 0 ? <button className="add-button" onClick={() => onQuantityChange(product, 1)}>Add to bag</button> : <div className="quantity-control"><button onClick={() => onQuantityChange(product, quantity - 1)} aria-label="Decrease quantity">−</button><strong>{quantity}</strong><button onClick={() => onQuantityChange(product, quantity + 1)} aria-label="Increase quantity">+</button></div>}</div>
  </article>;
}
