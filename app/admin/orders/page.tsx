import type { Metadata } from "next";
import AdminClient from "../AdminClient";

export const metadata: Metadata = {
  title: "Order Queue | Admin",
};

export default function AdminOrdersPage() {
  return <AdminClient section="orders" />;
}
