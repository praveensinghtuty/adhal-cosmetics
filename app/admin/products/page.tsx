import type { Metadata } from "next";
import AdminClient from "../AdminClient";

export const metadata: Metadata = {
  title: "Product Visibility | Admin",
};

export default function AdminProductsPage() {
  return <AdminClient section="products" />;
}
