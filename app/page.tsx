import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Discover handmade, natural cosmetics including soaps, creams, and hair care products.",
};

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-20 bg-stone-50 text-gray-900">
      {/* Hero Section */}
      <section className="text-center py-24 px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          Handmade Cosmetics, Naturally
        </h1>

        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
          Crafted with care using natural ingredients. Gentle on your skin, kind
          to the planet.
        </p>

        <a
          href="/products"
          className="inline-block mt-8 bg-rose-600 hover:bg-rose-700
               text-white font-semibold px-6 py-3 rounded-xl shadow-md"
        >
          View Products
        </a>
      </section>

      {/* About Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Why Our Cosmetics?
            </h2>

            <p className="mt-4 text-gray-600">
              Our products are handmade in small batches using skin-safe,
              ethically sourced ingredients. No harsh chemicals, no shortcuts —
              just honest skincare.
            </p>
          </div>

          <div
            className="bg-rose-50 rounded-xl h-56 flex items-center justify-center
                    text-rose-600 font-medium"
          >
            Image Placeholder
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
          Featured Products
        </h2>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3
                  gap-6 md:gap-8 max-w-6xl mx-auto px-4"
        >
          {["Soap", "Face Cream", "Lip Balm"].map((item) => (
            <div
              key={item}
              className="bg-white border border-gray-300 rounded-xl p-4
                   shadow-sm text-center"
            >
              <div className="h-40 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                Image
              </div>

              <h3 className="font-semibold text-gray-900">{item}</h3>
              <p className="text-sm text-gray-500 mt-1">Coming soon</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
