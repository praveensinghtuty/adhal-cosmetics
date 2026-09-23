import type { Metadata } from "next";
import ProductDetailsClient from "./ProductDetailsClient";
import { formatPrice, getSalePrice, hasSale, SaleFields } from "@/lib/sales";
import { supabase } from "@/lib/supabaseClient";

type ProductMetadata = {
  id: string;
  name: string;
  description: string | null;
  short_description: string | null;
  price: number;
  image_url: string | null;
} & SaleFields;

const getSiteUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

const getAbsoluteUrl = (url: string | null, siteUrl: string) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${siteUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabase
    .from("products")
    .select("id,name,description,short_description,price,image_url,sale_name,discount_percentage")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  const product = data as ProductMetadata | null;
  if (!product) {
    return {
      title: "Product Details",
      description: "View product details, pricing, and order handmade Adhal Cosmetics products.",
    };
  }

  const siteUrl = getSiteUrl();
  const productUrl = `${siteUrl}/products/${product.id}`;
  const currentPrice = hasSale(product) ? getSalePrice(product.price, product.discount_percentage) : product.price;
  const description = product.short_description || product.description || `Order ${product.name} from Adhal Cosmetics.`;
  const title = `${product.name} - ₹${formatPrice(currentPrice)}`;
  const image = getAbsoluteUrl(product.image_url, siteUrl);

  return {
    title,
    description,
    alternates: { canonical: productUrl },
    openGraph: {
      title,
      description,
      url: productUrl,
      siteName: "Adhal Cosmetics",
      type: "website",
      images: image ? [{ url: image, width: 1200, height: 630, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailsClient productId={id} />;
}
