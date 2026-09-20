import type { Metadata } from "next";
import AdminClient from "../../AdminClient";

export const metadata: Metadata = {
  title: "Add Product | Admin",
};

export default function AdminAddProductPage() {
  return <AdminClient section="add-product" />;
}
