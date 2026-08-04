"use client";

import { useEffect, useState } from "react";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import ProductCard from "@/components/ProductCard";
import OrderModal from "@/components/OrderModal";
import ProductSearch from "@/components/ProductSearch";
import { getSalePrice, hasSale, SaleFields } from "@/lib/sales";

type Product = { id: string; name: string; description: string | null; price: number; image_url: string | null; tags: string[]; } & SaleFields;
const CART_STORAGE_KEY = "homemade_cosmetics_cart";
const SHOP_CATEGORIES = [
  { name: "Oils", image: "/images/categories/oils.svg", keywords: ["oil", "serum"] },
  { name: "Soaps", image: "/images/categories/soaps.svg", keywords: ["soap", "bar", "cleanser", "wash"] },
  { name: "Creams", image: "/images/categories/creams.svg", keywords: ["cream", "moistur", "lotion", "butter", "balm"] },
  { name: "Hair Care", image: "/images/categories/hair-care.svg", keywords: ["hair", "shampoo", "conditioner", "scalp", "shikakai"] },
] as const;

export default function ProductsClient({ initialSearch = "" }: { initialSearch?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, Product & { quantity: number }>>(() => {
    if (typeof window === "undefined") return {};
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return {};
    try { return JSON.parse(stored); } catch { localStorage.removeItem(CART_STORAGE_KEY); return {}; }
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearch.trim());

  useEffect(() => {
    supabase.from("products").select("id,name,description,price,image_url,tags,sale_name,discount_percentage").eq("is_active", true).then(({ data }) => {
      const currentProducts = data || [];
      setProducts(currentProducts);
      setCart((current) => {
        const next = { ...current };
        currentProducts.forEach((product) => {
          if (!next[product.id]) return;
          next[product.id] = {
            ...product,
            price: hasSale(product) ? getSalePrice(product.price, product.discount_percentage) : product.price,
            quantity: next[product.id].quantity,
          };
        });
        return next;
      });
    });
  }, []);
  useEffect(() => { if (Object.keys(cart).length) localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)); else localStorage.removeItem(CART_STORAGE_KEY); }, [cart]);

  const matchesCategory = (product: Product, categoryName: string) => {
    const category = SHOP_CATEGORIES.find((item) => item.name === categoryName);
    if (!category) return false;
    const searchable = `${product.name} ${product.description || ""} ${(product.tags || []).join(" ")}`.toLowerCase();
    return category.keywords.some((keyword) => searchable.includes(keyword));
  };
  const categories = SHOP_CATEGORIES.map((category) => ({ ...category, count: products.filter((product) => matchesCategory(product, category.name)).length }));
  const allTags = Array.from(new Set(products.flatMap((product) => product.tags || []))).sort((a, b) => a.localeCompare(b));
  const quickTags = allTags.slice(0, 3);
  const filtered = products.filter((product) => {
    const matchesSelectedCategory = !selectedCategory || matchesCategory(product, selectedCategory);
    const matchesSelectedTags = selectedTags.length === 0 || selectedTags.some((tag) => product.tags?.includes(tag));
    const searchable = `${product.name} ${product.description || ""} ${(product.tags || []).join(" ")}`.toLowerCase();
    const matchesSearch = !searchQuery || searchable.includes(searchQuery.toLowerCase());
    return matchesSelectedCategory && matchesSelectedTags && matchesSearch;
  });
  const quantity = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  const total = Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0);
  const updateQuantity = (product: Product, value: number) => setCart((previous) => { const next = { ...previous }; if (value <= 0) delete next[product.id]; else next[product.id] = { ...product, quantity: value }; return next; });
  const chooseCategory = (category: string | null) => {
    setSelectedCategory(category);
    window.setTimeout(() => document.querySelector("#catalog-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  const toggleTag = (tag: string) => setSelectedTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  const openFilters = () => { setDraftTags(selectedTags); setShowFilters(true); };
  const toggleDraftTag = (tag: string) => setDraftTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  const clearAllFilters = () => { setSelectedCategory(null); setSelectedTags([]); setSearchQuery(""); };

  return <main className="catalog-page"><div className="site-shell">
    <div className="catalog-search-wrap"><ProductSearch initialValue={initialSearch} /></div>
    <header className="catalog-header"><p className="eyebrow">The collection</p><h1 className="section-title">Everyday care, made slowly.</h1><p className="section-copy">Explore handmade essentials for your skin and hair. Simple formulas, botanical ingredients, and no unnecessary extras.</p></header>
    {categories.length > 0 && <section className="category-section" aria-labelledby="category-title">
      <div className="category-heading"><div><p className="eyebrow">Find your ritual</p><h2 id="category-title">Shop by category</h2></div><p>Choose what your routine needs today.</p></div>
      <div className="category-grid">
        {categories.map((category) => <button key={category.name} className={`category-card ${selectedCategory === category.name ? "active" : ""}`} onClick={() => chooseCategory(category.name)}>
          <span className="category-image"><img src={category.image} alt="" /></span>
          <span className="category-overlay" />
          <span className="category-copy"><strong>{category.name}</strong><small>{category.count} {category.count === 1 ? "product" : "products"}</small></span>
        </button>)}
      </div>
    </section>}
    <section id="catalog-results" className="catalog-results">
      <div className="catalog-toolbar"><div className="quick-filters" aria-label="Product filters"><div className="filter-scroll"><button className={`filter-chip ${selectedCategory === null && selectedTags.length === 0 ? "active" : ""}`} onClick={clearAllFilters}>All products</button>{quickTags.map((tag) => <button key={tag} className={`filter-chip ${selectedTags.includes(tag) ? "active" : ""}`} onClick={() => toggleTag(tag)}>{tag}</button>)}</div><button className="filter-chip more-filter-button" onClick={openFilters}><SlidersHorizontal size={14} /> More filters{selectedTags.length > 0 && <span>{selectedTags.length}</span>}</button></div></div>
      {(selectedCategory || selectedTags.length > 0 || searchQuery) && <div className="active-filters"><span>Showing:</span>{searchQuery && <button onClick={() => setSearchQuery("")}>Search: “{searchQuery}” <X size={12} /></button>}{selectedCategory && <button onClick={() => setSelectedCategory(null)}>{selectedCategory} <X size={12} /></button>}{selectedTags.map((tag) => <button key={tag} onClick={() => toggleTag(tag)}>{tag} <X size={12} /></button>)}<button className="clear-filters" onClick={clearAllFilters}>Clear all</button></div>}
      <div className="results-summary"><h2>{searchQuery ? `Results for “${searchQuery}”` : selectedCategory || "All products"}</h2><span>{filtered.length} {filtered.length === 1 ? "product" : "products"}</span></div>
      {filtered.length ? <div className="catalog-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} quantity={cart[product.id]?.quantity || 0} onQuantityChange={updateQuantity} />)}</div> : <div className="empty-state">No products found in this collection.</div>}
    </section>
  </div>
  {quantity > 0 && <div className="cart-bar"><div className="cart-bar-copy"><strong>{quantity} {quantity === 1 ? "item" : "items"} in your bag</strong><span>₹{total} total</span></div><button onClick={() => setShowModal(true)}>Review order</button></div>}
  {showFilters && <div className="overlay filter-modal-shell" onClick={() => setShowFilters(false)}><section className="filter-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="filter-title">
    <header className="filter-modal-header"><div><p className="eyebrow">Refine your search</p><h2 id="filter-title">Select filters</h2></div><button className="icon-button" onClick={() => setShowFilters(false)} aria-label="Close filters"><X size={19} /></button></header>
    <p className="filter-help">Select one or more tags. We’ll show products matching any of your selections.</p>
    <div className="filter-options">{allTags.map((tag) => { const checked = draftTags.includes(tag); return <button key={tag} className={`filter-option ${checked ? "selected" : ""}`} onClick={() => toggleDraftTag(tag)}><span>{tag}</span><span className="filter-check">{checked && <Check size={14} strokeWidth={3} />}</span></button>; })}</div>
    <footer className="filter-modal-actions"><button className="button-secondary" onClick={() => setDraftTags([])}>Clear</button><button className="button-primary" onClick={() => { setSelectedTags(draftTags); setShowFilters(false); window.setTimeout(() => document.querySelector("#catalog-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }}>Show {draftTags.length ? "matching" : "all"} products</button></footer>
  </section></div>}
  {showModal && quantity > 0 && <OrderModal cart={cart} totalAmount={total} onClose={() => setShowModal(false)} onClearCart={() => { setCart({}); setShowModal(false); }} onRemoveItem={(id) => setCart((previous) => { const next = { ...previous }; delete next[id]; return next; })} />}
  </main>;
}
