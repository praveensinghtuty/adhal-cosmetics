import "./globals.css";
import Navbar from "@/components/Navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Adhal Cosmetics",
    template: "%s | Adhal Cosmetics",
  },
  description:
    "Handmade natural cosmetics crafted with care. Soaps, creams, hair oils, and skincare products.",
  keywords: [
    "homemade cosmetics",
    "natural skincare",
    "herbal soap",
    "handmade beauty products",
  ],
  openGraph: {
    title: "Adhal Cosmetics",
    description: "Natural, handmade skincare products made with love and care.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className="min-h-screen flex flex-col bg-stone-50 text-gray-900
                 pb-[env(safe-area-inset-bottom)]"
      >
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
