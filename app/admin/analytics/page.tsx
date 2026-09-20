import type { Metadata } from "next";
import AdminClient from "../AdminClient";

export const metadata: Metadata = {
  title: "Analytics | Admin",
};

export default function AdminAnalyticsPage() {
  return <AdminClient section="analytics" />;
}
