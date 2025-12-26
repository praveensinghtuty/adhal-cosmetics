import type { Metadata } from "next";
import ProductsClient from "./ProductsClient";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse our range of handmade cosmetics. Select products and order easily via WhatsApp.",
};

export default function ProductsPage() {
  return <ProductsClient />;
}
