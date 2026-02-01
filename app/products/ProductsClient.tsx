"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProductCard from "@/components/ProductCard";
import OrderModal from "@/components/OrderModal";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  tags: string[];
};

const CART_STORAGE_KEY = "homemade_cosmetics_cart";

export default function ProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<
    Record<string, Product & { quantity: number }>
  >({});
  const [showModal, setShowModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const clearCart = () => {
    setCart({});
    setShowModal(false);
  };

  useEffect(() => {
    if (showModal && Object.keys(cart).length === 0) {
      setShowModal(false);
    }
  }, [cart, showModal]);

  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    supabase
      .from("products")
      .select("id, name, description, price, image_url, tags")
      .eq("is_active", true)
      .then(({ data }) => setProducts(data || []));
  }, []);

  useEffect(() => {
    if (Object.keys(cart).length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY);
    } else {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart]);

  const allTags = Array.from(new Set(products.flatMap((p) => p.tags || [])));

  const filteredProducts = selectedTag
    ? products.filter((p) => p.tags.includes(selectedTag))
    : products;

  const updateQuantity = (product: Product, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      }
      return { ...prev, [product.id]: { ...product, quantity } };
    });
  };

  const removeItemFromCart = (productId: string) => {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  const totalAmount = Object.values(cart).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const baseChip =
    "px-4 py-1.5 rounded-full text-sm font-medium border transition whitespace-nowrap";

  const activeChip = "bg-rose-600 text-white border-rose-600 shadow-sm";

  const inactiveChip =
    "bg-white text-gray-700 border-gray-300 hover:border-rose-600 hover:text-rose-600";

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
                py-6 pb-28 bg-stone-50"
    >
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Our Products</h1>

      {/* Filters */}
      <div className="mb-10">
        <div className="flex flex-wrap gap-2 sm:gap-3 bg-white p-4 rounded-xl border border-gray-200">
          <button
            onClick={() => setSelectedTag(null)}
            className={`${baseChip} ${
              selectedTag === null ? activeChip : inactiveChip
            }`}
          >
            All
          </button>

          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`${baseChip} ${
                selectedTag === tag ? activeChip : inactiveChip
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                gap-5 sm:gap-6 md:gap-8"
      >
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            quantity={cart[product.id]?.quantity || 0}
            onQuantityChange={updateQuantity}
          />
        ))}
      </div>

      {/* Place Order Button */}
      {Object.keys(cart).length > 0 && (
        <div
          className="
    fixed bottom-4 left-0 right-0
    flex justify-center
    px-4
    z-40
  "
        >
          <button
            onClick={() => setShowModal(true)}
            className="
        w-full sm:w-auto
        flex items-center justify-between sm:justify-center
        gap-3
        bg-green-600 hover:bg-green-700
        text-white
        font-semibold
        px-6 py-3
        rounded-xl
        shadow-lg
        transition
        active:scale-[0.98]
      "
          >
            <span>Place Order</span>
            <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">
              ₹{totalAmount}
            </span>
          </button>
        </div>
      )}

      {showModal && Object.keys(cart).length > 0 && (
        <OrderModal
          cart={cart}
          totalAmount={totalAmount}
          onClose={() => setShowModal(false)}
          onClearCart={clearCart}
          onRemoveItem={removeItemFromCart}
        />
      )}
    </div>
  );
}
