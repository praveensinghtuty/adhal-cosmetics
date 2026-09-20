import type { Metadata } from "next";
import AdminClient from "../AdminClient";

export const metadata: Metadata = {
  title: "Create Sale | Admin",
};

export default function AdminSalesPage() {
  return <AdminClient section="sales" />;
}
