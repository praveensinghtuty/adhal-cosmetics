"use client";

import Link from "next/link";
import { ArrowLeft, Check, Copy, Heart, Leaf, Mail, MessageCircle, MoreHorizontal, PackageCheck, Share2, ShieldCheck, ShoppingBag, Sparkles, X } from "lucide-react";
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

type ProductReview = {
  id: string;
  name: string;
  rating: number;
  comment: string;
};

const defaultBenefits = ["Handmade in small batches", "Gentle for everyday routines", "Packed fresh with care"];
const defaultHowToUse = ["Apply on damp skin or hair as suitable for the product.", "Use gentle circular motions.", "Rinse or leave on as directed by your routine."];
const defaultBestFor = ["Daily self-care", "Simple botanical routines", "Customers who prefer handmade care"];

export default function ProductDetailsClient({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [gallery, setGallery] = useState<ProductImage[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
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
      supabase
        .from("reviews")
        .select("id,name,rating,comment")
        .eq("product_id", productId)
        .order("created_at", { ascending: false }),
    ]).then(async ([productResult, galleryResult, reviewsResult]) => {
      if (!active) return;
      const data = productResult.data as Product | null;
      setProduct(data);

      if (!data) {
        setGallery([]);
        setReviews([]);
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
      setReviews((reviewsResult.data as ProductReview[]) || []);

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

  const getProductUrl = () => {
    if (typeof window === "undefined") return `/products/${productId}`;
    return `${window.location.origin}/products/${productId}`;
  };

  const copyProductLink = async () => {
    const url = getProductUrl();
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 1800);
  };

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
  const reviewCount = reviews.length;
  const averageRating = reviewCount ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewCount : 0;
  const roundedRating = Math.round(averageRating);
  const productUrl = getProductUrl();
  const shareText = `Check out ${product.name} from Adhal Cosmetics`;
  const encodedShareText = encodeURIComponent(`${shareText}\n${productUrl}`);

  const shareProduct = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: shareText, url: productUrl });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    setShowShareOptions(true);
  };

  return <main className="product-detail-page">
    <div className="site-shell">
      <Link className="back-link" href="/products"><ArrowLeft size={16} /> Back to products</Link>
      <section className="product-detail-layout">
        <div className="product-gallery">
          <div className="product-gallery-toolbar">
            {reviewCount > 0 ? <a className="gallery-review-pill" href="#product-reviews" aria-label={`${averageRating.toFixed(1)} out of 5 from ${reviewCount} reviews`}>
              <span>{"★".repeat(roundedRating)}{"☆".repeat(5 - roundedRating)}</span>
              <strong>{averageRating.toFixed(1)}</strong>
              <small>{reviewCount} {reviewCount === 1 ? "review" : "reviews"}</small>
            </a> : <span className="gallery-review-pill muted">No reviews yet</span>}
            <button className="product-image-share" onClick={() => setShowShareOptions(true)} aria-label="Share product"><Share2 size={18} /></button>
          </div>
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

      <section id="product-reviews" className="product-reviews-section">
        <div className="product-reviews-heading"><div><p className="eyebrow">Customer reviews</p><h2 className="section-title">What customers say.</h2></div>{reviewCount > 0 && <span className="review-total">{averageRating.toFixed(1)} ★ · {reviewCount} {reviewCount === 1 ? "review" : "reviews"}</span>}</div>
        {reviewCount > 0 ? <div className="product-review-list">{reviews.slice(0, 3).map((review) => <article key={review.id} className="product-review-card"><div><strong>{review.name}</strong><span>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span></div><p>“{review.comment}”</p></article>)}</div> : <div className="empty-state">No reviews yet for this product.</div>}
      </section>
      {relatedProducts.length > 0 && <section className="related-products">
        <div className="section-heading-row"><div><p className="eyebrow">You may also like</p><h2 className="section-title">More from the collection.</h2></div></div>
        <div className="catalog-grid">{relatedProducts.map((item) => <ProductCard key={item.id} product={item} quantity={cart[item.id]?.quantity || 0} onQuantityChange={updateQuantity} />)}</div>
      </section>}
    </div>
    {showShareOptions && <div className="overlay product-share-overlay" onClick={() => setShowShareOptions(false)}>
      <section className="product-share-sheet" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Share this product">
        <button className="share-sheet-close" onClick={() => setShowShareOptions(false)} aria-label="Close share"><X size={18} /></button>
        <h2>Share this product with friends</h2>
        <div className="share-product-preview">
          {selectedImage && <img src={selectedImage} alt={product.name} />}
          <div>
            {reviewCount > 0 && <div className="share-preview-rating"><span>{"★".repeat(roundedRating)}{"☆".repeat(5 - roundedRating)}</span><small>{reviewCount}</small></div>}
            <p>{product.name}</p>
          </div>
        </div>
        <div className="share-actions">
          <a href={`https://wa.me/?text=${encodedShareText}`} target="_blank" rel="noreferrer"><span className="share-action-icon whatsapp"><MessageCircle size={22} /></span><small>WhatsApp</small></a>
          <button onClick={copyProductLink}><span className="share-action-icon"><Copy size={22} /></span><small>{shareCopied ? "Copied" : "Copy"}</small></button>
          <a href={`mailto:?subject=${encodeURIComponent(product.name)}&body=${encodedShareText}`}><span className="share-action-icon"><Mail size={22} /></span><small>Email</small></a>
          <button onClick={shareProduct}><span className="share-action-icon"><MoreHorizontal size={22} /></span><small>More</small></button>
        </div>
      </section>
    </div>}
    {quantity > 0 && <div className="cart-bar"><div className="cart-bar-copy"><strong>{quantity} {quantity === 1 ? "item" : "items"} in your bag</strong><span>₹{formatPrice(total)} total</span></div><button onClick={() => setShowModal(true)}>Review order</button></div>}
    {showModal && quantity > 0 && <OrderModal cart={cart} totalAmount={total} onClose={() => setShowModal(false)} onClearCart={() => { setCart({}); setShowModal(false); }} onRemoveItem={(id) => setCart((previous) => { const next = { ...previous }; delete next[id]; return next; })} />}
  </main>;
}


