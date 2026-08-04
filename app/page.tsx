"use client";

import { supabase } from "@/lib/supabaseClient";
import ProductSearch from "@/components/ProductSearch";
import { ArrowRight, Check, Droplets, FlaskConical, Heart, Leaf } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, getSalePrice, hasSale, SaleFields } from "@/lib/sales";

interface Product extends SaleFields { id: string; name: string; price: number; image_url: string; }

const principles = [
  { icon: Leaf, title: "Botanical first", text: "Herbs, oils and time-tested ingredients chosen with intention." },
  { icon: FlaskConical, title: "Small batches", text: "Handmade in limited quantities for freshness and attention." },
  { icon: Droplets, title: "Nothing harsh", text: "No sulphates, parabens or unnecessary artificial fragrance." },
  { icon: Heart, title: "Made with care", text: "Gentle daily essentials created for real skin and hair." },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const router = useRouter();

  useEffect(() => {
    supabase.from("products").select("id,name,price,image_url,sale_name,discount_percentage").eq("is_active", true).limit(3).then(({ data }) => setProducts(data || []));
  }, []);

  return (
    <main className="home">
      <section className="hero">
        <div className="page-search-wrap site-shell"><ProductSearch /></div>
        <div className="site-shell hero-inner">
          <div className="hero-content">
            <p className="eyebrow">Rooted in nature · Made by hand</p>
            <h1 className="display-title">Honest care,<br />grown slowly.</h1>
            <p className="hero-lead">Small-batch herbal care for skin and hair—thoughtfully made with familiar botanicals and nothing you do not need.</p>
            <div className="hero-actions">
              <button className="button-primary" onClick={() => router.push("/products")}>Shop the collection <ArrowRight size={16} /></button>
              <button className="button-secondary" onClick={() => document.querySelector("#our-story")?.scrollIntoView()}>Our philosophy</button>
            </div>
            <div className="hero-proof"><div className="proof-dots"><span>A</span><span>R</span><span>S</span></div><span><strong>Loved by mindful routines</strong><br />Simple care, thoughtfully shared</span></div>
          </div>
        </div>
      </section>

      <section className="home-section" id="our-story">
        <div className="site-shell intro-grid">
          <div><p className="eyebrow">The Adhal way</p><h2 className="section-title">Tradition, made relevant for today.</h2><p className="section-copy">We pair generations-old ingredient wisdom with a slower, more transparent way of making personal care.</p></div>
          <div className="principles">{principles.map(({ icon: Icon, title, text }) => <article className="principle-card" key={title}><div className="principle-icon"><Icon size={19} strokeWidth={1.7} /></div><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div>
      </section>

      <section className="home-section featured-section">
        <div className="site-shell">
          <div className="section-heading-row"><div><p className="eyebrow">Everyday rituals</p><h2 className="section-title">Made for your daily care.</h2></div><button className="text-link" onClick={() => router.push("/products")}>Explore all products <ArrowRight size={16} /></button></div>
          <div className="featured-grid">
            {products.map((product) => { const isOnSale = hasSale(product); const salePrice = getSalePrice(product.price, product.discount_percentage); return <article className="featured-card" key={product.id} onClick={() => router.push("/products")}><div className="featured-image">{isOnSale && <span className="sale-pill">{product.sale_name}</span>}<img src={product.image_url} alt={product.name} /></div><div className="featured-info"><h3>{product.name}</h3><span className="featured-price">{isOnSale && <del>₹{formatPrice(product.price)}</del>}₹{formatPrice(isOnSale ? salePrice : product.price)}</span></div></article>; })}
            {!products.length && [1,2,3].map((item) => <div className="featured-card" key={item}><div className="featured-image" /><div className="featured-info"><h3>Made with care</h3><span>—</span></div></div>)}
          </div>
        </div>
      </section>

      <section className="home-section"><div className="site-shell story-grid">
        <div className="story-visual"><div className="story-note"><strong>Ingredients you recognise</strong><span>Rosemary, shikakai, saffron, charcoal and cold-pressed oils.</span></div></div>
        <div><p className="eyebrow">Powered by nature</p><h2 className="section-title">Fewer ingredients.<br />More intention.</h2><p className="section-copy">Each formula begins with a purpose. We select botanicals for what they do, keep our recipes uncomplicated, and make every batch with patience.</p><ul className="check-list">{["Cold-pressed, botanical oils", "Herbal infusions made in small batches", "Transparent ingredient choices", "Gentle enough for lasting routines"].map((item) => <li key={item}><span><Check size={14} /></span>{item}</li>)}</ul></div>
      </div></section>

      <section className="cta-wrap"><div className="site-shell"><div className="cta-card"><p className="eyebrow">Your ritual starts here</p><h2 className="section-title">Care that feels good—and makes sense.</h2><p className="section-copy">Find a simpler, more natural rhythm for your everyday skin and hair care.</p><button className="button-primary" onClick={() => router.push("/products")}>Browse all products <ArrowRight size={16} /></button></div></div></section>

      <footer className="footer"><div className="site-shell footer-inner"><span>© {new Date().getFullYear()} Adhal Cosmetics</span><span>Small-batch herbal care, made thoughtfully.</span></div></footer>
    </main>
  );
}
