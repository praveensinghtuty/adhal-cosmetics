"use client";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
}

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentReview, setCurrentReview] = useState(0);
  const [showPopup, setShowPopup] = useState(false);

  const scrollNext = () => {
    window.scrollTo({
      top: window.innerHeight - 64,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (!scrollRef.current || products.length === 0) return;

    const el = scrollRef.current;

    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % products.length;

        const cardWidth = el.clientWidth * 0.75 + 16;

        el.scrollTo({
          left: next * cardWidth,
          behavior: "smooth",
        });

        return next;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [products]);

  useEffect(() => {
    if (!reviews.length) return;

    let index = 0;

    const showNext = () => {
      if (index >= reviews.length) return; // stop after all shown

      setCurrentReview(index);
      setShowPopup(true);

      // hide after 3.5s
      setTimeout(() => {
        setShowPopup(false);
      }, 3500);

      index++;

      // schedule next
      setTimeout(showNext, 6000);
    };

    // start after small delay (important)
    const startTimeout = setTimeout(showNext, 2500);

    return () => clearTimeout(startTimeout);
  }, [reviews]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from("products").select("*");

      if (error) {
        console.error(error);
      } else {
        setProducts(data);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      setReviews(data || []);
    };

    fetchReviews();
  }, []);

  return (
    <main className="home">
      {/* HERO */}
      <section className="hero">
        <div className="hero-overlay">
          <div className="hero-content">
            <h1>
              Organic. Handmade.
              <br />
              Honest Care.
            </h1>

            <p>
              Thoughtfully crafted herbal cosmetics made in small batches to
              nourish your skin and hair.
            </p>

            <div className="hero-actions">
              <button
                className="primary"
                onClick={() => router.push("/products")}
              >
                Shop Now
              </button>
              <button className="secondary" onClick={scrollNext}>
                Explore more
              </button>
            </div>
            <div className="hero-divider" />
            <div className="scroll-indicator">
              <span />
            </div>
          </div>
        </div>
      </section>
      <div className="half-screen-wrapper">
        {/* PHILOSOPHY */}
        <section className="section philosophy">
          <div className="philo-head">
            <h2>Rooted in Tradition</h2>
            <p>
              Crafted with care using time-tested herbs, oils, and botanicals —
              pure, gentle, and made without shortcuts.
            </p>
          </div>

          <div className="philo-grid">
            <div className="philo-item">
              <span>🌿</span>
              <p>100% Herbal Ingredients</p>
            </div>

            <div className="philo-item">
              <span>🧼</span>
              <p>Handmade in Small Batches</p>
            </div>

            <div className="philo-item">
              <span>❌</span>
              <p>No Sulphates or Parabens</p>
            </div>

            <div className="philo-item">
              <span>♻️</span>
              <p>Eco-conscious Choices</p>
            </div>
          </div>
        </section>

        {/* FEATURED PRODUCTS */}
        <section className="section products">
          <div className="products-head">
            <h2>Featured Products</h2>
            <p className="section-sub">
              Handmade essentials for your daily care
            </p>
          </div>

          <div className="carousel" ref={scrollRef}>
            {products.map((product, index) => (
              <div className="carousel-item" key={product.id}>
                <div
                  className="product-card-soft"
                  onClick={() => router.push("/products")}
                >
                  <img src={product.image_url} alt={product.name} />

                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="price">₹{product.price}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DOTS */}
          <div className="dots">
            {products.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === activeIndex ? "active" : ""}`}
              />
            ))}
          </div>

          <button className="link-btn" onClick={() => router.push("/products")}>
            View All Products →
          </button>
        </section>
      </div>
      {/* INGREDIENT STORY */}
      <section className="section ingredients alt">
        <h2>Powered by Nature</h2>
        <p>
          From rosemary and shikakai to saffron and charcoal, every ingredient
          is carefully selected for its proven benefits — nothing artificial,
          nothing unnecessary.
        </p>

        <ul>
          <li>Cold-pressed oils</li>
          <li>Herbal infusions</li>
          <li>No artificial fragrance</li>
          <li>Safe for long-term use</li>
        </ul>
      </section>

      {/* WHY ADHAL */}
      <section className="section why">
        <h2>Why Choose Adhal?</h2>
        <p className="section-sub">
          Thoughtfully crafted for clean and conscious care
        </p>

        <ul>
          <li>✔ Handmade, not factory-produced</li>
          <li>✔ Transparent ingredient lists</li>
          <li>✔ Inspired by traditional Indian self-care</li>
          <li>✔ Loved by clean beauty seekers</li>
        </ul>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Begin Your Natural Care Journey</h2>
        <p>Discover products that respect your skin, hair, and nature.</p>
        <button className="primary" onClick={() => router.push("/products")}>
          Browse All Products
        </button>
      </section>

      {showPopup && reviews[currentReview] && (
        <div className="review-popup">
          <div className="review-popup-header">
            <div className="avatar">
              {reviews[currentReview].name?.charAt(0).toUpperCase()}
            </div>

            <div className="review-meta">
              <span className="review-name">{reviews[currentReview].name}</span>
              <span className="review-stars">
                {"★".repeat(reviews[currentReview].rating)}
              </span>
            </div>
          </div>

          <p className="review-text">“{reviews[currentReview].comment}”</p>
        </div>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <p>About · Contact · Instagram · WhatsApp</p>
        <small>© Adhal Cosmetics</small>
      </footer>
    </main>
  );
}
