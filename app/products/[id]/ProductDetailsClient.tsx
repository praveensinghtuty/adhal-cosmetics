"use client";

import Link from "next/link";
import { ArrowLeft, Check, Heart, Leaf, PackageCheck, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import OrderModal from "@/components/OrderModal";
import ProductCard from "@/components/ProductCard";
import { CART_STORAGE_KEY } from "@/lib/cart";
import { formatPrice, getSalePrice, hasSale, SaleFields } from "@/lib/sales";
import { supabase } from "@/lib/supabaseClient";

type Product = {
  id: string;
  name: string;
  description: string | null;
  short_description?: string | null;
  benefits?: string[] | null;
  ingredients?: string[] | null;
  how_to_use?: string[] | null;
  best_for?: string[] | null;
  net_weight?: string | null;
  shelf_life?: string | null;
  price: number;
  image_url: string | null;
  tags: string[];
} & SaleFields;

type ProductImage = {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
};

const defaultBenefits = ["Handmade in small batches", "Gentle for everyday routines", "Packed fresh with care"];
const defaultHowToUse = ["Apply on damp skin or hair as suitable for the product.", "Use gentle circular motions.", "Rinse or leave on as directed by your routine."];
const defaultBestFor = ["Daily self-care", "Simple botanical routines", "Customers who prefer handmade care"];

export default function ProductDetailsClient({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [gallery, setGallery] = useState<ProductImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [cart, setCart] = useState<Record<string, Product & { quantity: number }>>(() => {
    if (typeof window === "undefined") return {};
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return {};
    try { return JSON.parse(stored); } catch { localStorage.removeItem(CART_STORAGE_KEY); return {}; }
  });

  useEffect(() => {
    let active = true;
    Promise.all([
      supabase
        .from("products")
        .select("id,name,description,short_description,benefits,ingredients,how_to_use,best_for,net_weight,shelf_life,price,image_url,tags,sale_name,discount_percentage")
        .eq("id", productId)
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("product_images")
        .select("id,image_url,alt_text,sort_order,is_primary")
        .eq("product_id", productId)
        .order("is_primary", { ascending: false })
        .order("sort_order", { ascending: true }),
    ]).then(async ([productResult, galleryResult]) => {
      if (!active) return;
      const data = productResult.data as Product | null;
      setProduct(data);

      if (!data) {
        setGallery([]);
        setSelectedImage(null);
        setRelatedProducts([]);
        setLoading(false);
        return;
      }

      const galleryImages = (galleryResult.data || []) as ProductImage[];
      const primaryImage = data.image_url ? [{ id: "primary", image_url: data.image_url, alt_text: data.name, sort_order: -1, is_primary: true }] : [];
      const seenImages = new Set<string>();
      const nextGallery = [...primaryImage, ...galleryImages].filter((image) => {
        if (seenImages.has(image.image_url)) return false;
        seenImages.add(image.image_url);
        return true;
      });
      setGallery(nextGallery);
      setSelectedImage(nextGallery[0]?.image_url || data.image_url);

      const firstTag = data.tags?.[0];
      const relatedQuery = supabase
        .from("products")
        .select("id,name,description,short_description,benefits,ingredients,how_to_use,best_for,net_weight,shelf_life,price,image_url,tags,sale_name,discount_percentage")
        .eq("is_active", true)
        .neq("id", data.id)
        .limit(3);

      const { data: related } = firstTag ? await relatedQuery.contains("tags", [firstTag]) : await relatedQuery;
      if (!active) return;
      setRelatedProducts((related as Product[]) || []);
      setLoading(false);
    });

    return () => { active = false; };
  }, [productId]);

  useEffect(() => {
    if (Object.keys(cart).length) localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    else localStorage.removeItem(CART_STORAGE_KEY);
  }, [cart]);

  const quantity = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  const total = Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0);
  const updateQuantity = (item: Product, value: number) => setCart((previous) => {
    const next = { ...previous };
    if (value <= 0) delete next[item.id];
    else next[item.id] = { ...item, quantity: value };
    return next;
  });

  if (loading) {
    return <main className="product-detail-page"><div className="site-shell"><div className="empty-state">Loading product details...</div></div></main>;
  }

  if (!product) {
    return <main className="product-detail-page"><div className="site-shell product-missing"><p className="eyebrow">Product details</p><h1 className="section-title">This product is not available.</h1><p className="section-copy">It may have been removed or hidden from the current collection.</p><Link className="button-primary" href="/products"><ArrowLeft size={16} /> Back to products</Link></div></main>;
  }

  const isOnSale = hasSale(product);
  const currentPrice = isOnSale ? getSalePrice(product.price, product.discount_percentage) : product.price;
  const cartProduct = { ...product, price: currentPrice };
  const currentQuantity = cart[product.id]?.quantity || 0;
  const benefits = product.benefits?.length ? product.benefits : defaultBenefits;
  const howToUse = product.how_to_use?.length ? product.how_to_use : defaultHowToUse;
  const bestFor = product.best_for?.length ? product.best_for : defaultBestFor;
  const ingredients = product.ingredients?.length ? product.ingredients : product.tags || [];

  return <main className="product-detail-page">
    <div className="site-shell">
      <Link className="back-link" href="/products"><ArrowLeft size={16} /> Back to products</Link>
      <section className="product-detail-layout">
        <div className="product-gallery">
          <div className="product-detail-image">
            {isOnSale && <span className="sale-pill">{product.sale_name}</span>}
            {selectedImage ? <img src={selectedImage} alt={product.name} /> : <div className="empty-state">No image available</div>}
          </div>
          {gallery.length > 1 && <div className="product-thumbnails" aria-label="Product images">
            {gallery.map((image) => <button key={image.id} className={selectedImage === image.image_url ? "active" : ""} onClick={() => setSelectedImage(image.image_url)} aria-label={`View ${image.alt_text || product.name}`}><img src={image.image_url} alt="" /></button>)}
          </div>}
        </div>

        <div className="product-detail-copy">
          <p className="eyebrow">Adhal care</p>
          <h1 className="section-title">{product.name}</h1>
          <p className="product-detail-kicker">{product.short_description || "Handmade botanical care for simple everyday routines."}</p>
          {product.description && <p className="product-detail-description">{product.description}</p>}
          {product.tags?.length > 0 && <div className="product-detail-tags">{product.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
          <div className="product-detail-price">
            {isOnSale && <del>₹{formatPrice(product.price)}</del>}
            <strong>₹{formatPrice(currentPrice)}</strong>
            {isOnSale && <span>{product.discount_percentage}% off</span>}
          </div>
          <div className="product-detail-actions">
            {currentQuantity === 0 ? <button className="button-primary" onClick={() => updateQuantity(cartProduct, 1)}><ShoppingBag size={17} /> Add to bag</button> : <div className="quantity-control detail-quantity"><button onClick={() => updateQuantity(cartProduct, currentQuantity - 1)} aria-label="Decrease quantity">−</button><strong>{currentQuantity}</strong><button onClick={() => updateQuantity(cartProduct, currentQuantity + 1)} aria-label="Increase quantity">+</button></div>}
            {quantity > 0 && <button className="button-secondary" onClick={() => setShowModal(true)}>Review order</button>}
          </div>
          <ul className="detail-points">
            {["Handmade in small batches", "Packed fresh for daily routines", "Order directly from your account"].map((item) => <li key={item}><span><Check size={14} /></span>{item}</li>)}
          </ul>
        </div>
      </section>

      <section className="product-story-grid">
        <article className="product-info-panel highlight">
          <div className="product-info-heading"><Sparkles size={18} /><h2>Why you will like it</h2></div>
          <ul>{benefits.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
        <article className="product-info-panel">
          <div className="product-info-heading"><Leaf size={18} /><h2>Key ingredients</h2></div>
          {ingredients.length ? <div className="ingredient-chips">{ingredients.map((item) => <span key={item}>{item}</span>)}</div> : <p>No ingredient notes added yet.</p>}
        </article>
        <article className="product-info-panel">
          <div className="product-info-heading"><PackageCheck size={18} /><h2>How to use</h2></div>
          <ol>{howToUse.map((item) => <li key={item}>{item}</li>)}</ol>
        </article>
        <article className="product-info-panel">
          <div className="product-info-heading"><Heart size={18} /><h2>Best for</h2></div>
          <ul>{bestFor.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
      </section>

      <section className="product-facts">
        <div><ShieldCheck size={17} /><strong>Small batch</strong><span>Fresh handmade care</span></div>
        <div><PackageCheck size={17} /><strong>{product.net_weight || "Weight varies"}</strong><span>Net quantity</span></div>
        <div><Leaf size={17} /><strong>{product.shelf_life || "Use fresh"}</strong><span>Shelf life</span></div>
        <div><Heart size={17} /><strong>Tamil Nadu</strong><span>Delivery region</span></div>
      </section>

      {relatedProducts.length > 0 && <section className="related-products">
        <div className="section-heading-row"><div><p className="eyebrow">You may also like</p><h2 className="section-title">More from the collection.</h2></div></div>
        <div className="catalog-grid">{relatedProducts.map((item) => <ProductCard key={item.id} product={item} quantity={cart[item.id]?.quantity || 0} onQuantityChange={updateQuantity} />)}</div>
      </section>}
    </div>
    {quantity > 0 && <div className="cart-bar"><div className="cart-bar-copy"><strong>{quantity} {quantity === 1 ? "item" : "items"} in your bag</strong><span>₹{formatPrice(total)} total</span></div><button onClick={() => setShowModal(true)}>Review order</button></div>}
    {showModal && quantity > 0 && <OrderModal cart={cart} totalAmount={total} onClose={() => setShowModal(false)} onClearCart={() => { setCart({}); setShowModal(false); }} onRemoveItem={(id) => setCart((previous) => { const next = { ...previous }; delete next[id]; return next; })} />}
  </main>;
}
