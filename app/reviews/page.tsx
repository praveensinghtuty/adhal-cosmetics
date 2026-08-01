"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
type Review = { id: string; name: string; rating: number; comment: string; product_name: string | null; };
type Product = { id: string; name: string; };

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]); const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState(""); const [rating, setRating] = useState(5); const [comment, setComment] = useState(""); const [selectedProduct, setSelectedProduct] = useState(""); const [submitting, setSubmitting] = useState(false);
  const fetchReviews = async () => { const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false }); setReviews(data || []); };
  useEffect(() => {
    supabase.from("reviews").select("*").order("created_at", { ascending: false }).then(({ data }) => setReviews(data || []));
    supabase.from("products").select("id,name").eq("is_active", true).then(({ data }) => setProducts(data || []));
  }, []);
  const addReview = async () => { if (!name.trim() || !comment.trim() || submitting) return; setSubmitting(true); const product = products.find((item) => item.id === selectedProduct); await supabase.from("reviews").insert([{ name: name.trim(), rating, comment: comment.trim(), product_id: selectedProduct || null, product_name: product?.name || null }]); setName(""); setComment(""); setRating(5); setSelectedProduct(""); await fetchReviews(); setSubmitting(false); };

  return <main className="reviews-page"><div className="site-shell reviews-layout">
    <div><p className="eyebrow">Customer stories</p><h1 className="section-title">Real routines.<br />Kind words.</h1><p className="section-copy">Tried something from Adhal? Share your experience and help someone else find a gentler routine.</p>
      <div className="review-form-card">
        <div className="form-field"><label htmlFor="review-name">Your name</label><input id="review-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="How should we call you?" /></div>
        <div className="form-field"><label htmlFor="review-product">Product (optional)</label><select id="review-product" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}><option value="">Choose a product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></div>
        <div className="form-field"><label>Your rating</label><div className="star-row" aria-label={`${rating} out of 5 stars`}>{[1,2,3,4,5].map((star) => <button className={`star-button ${star <= rating ? "active" : ""}`} onClick={() => setRating(star)} key={star} aria-label={`${star} stars`}>★</button>)}</div></div>
        <div className="form-field"><label htmlFor="review-comment">Your experience</label><textarea id="review-comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell us what you loved..." /></div>
        <button className="button-primary" onClick={addReview} disabled={submitting}>{submitting ? "Sharing…" : "Share review"}</button>
      </div>
    </div>
    <section className="reviews-list" aria-label="Customer reviews">{reviews.length ? reviews.map((review) => <article className="review-card" key={review.id}><div className="review-head"><strong>{review.name}</strong><span className="review-stars">{"★".repeat(review.rating)}</span></div><p>“{review.comment}”</p>{review.product_name && <span className="review-product">{review.product_name}</span>}</article>) : <div className="empty-state">Be the first to share your Adhal experience.</div>}</section>
  </div></main>;
}
