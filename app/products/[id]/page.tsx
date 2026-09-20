import type { Metadata } from "next";
import ProductDetailsClient from "./ProductDetailsClient";

export const metadata: Metadata = {
  title: "Product Details",
  description: "View product details, pricing, and order handmade Adhal Cosmetics products.",
};

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailsClient productId={id} />;
}
