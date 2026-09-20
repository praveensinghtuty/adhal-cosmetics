"use client";

import type { User } from "@supabase/supabase-js";
import { Home, LogOut, MapPin, Package, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
      if (!data.user) router.replace("/account/login");
    });
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (loading) return <main className="account-page"><div className="site-shell"><div className="empty-state">Loading account...</div></div></main>;
  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.email || user.phone || "Customer";

  return (
    <main className="account-page">
      <div className="site-shell">
        <div className="account-header">
          <div><p className="eyebrow">Account</p><h1 className="section-title">Welcome, {displayName}</h1></div>
          <button className="button-secondary" onClick={logout}><LogOut size={16} /> Sign out</button>
        </div>
        <div className="account-grid">
          <Link className="account-card" href="/account/orders"><Package size={22} /><h2>Your orders</h2><p>Track current orders and view previous purchases.</p></Link>
          <Link className="account-card" href="/account/addresses"><MapPin size={22} /><h2>Addresses</h2><p>Save home, work, and gift delivery addresses.</p></Link>
          <Link className="account-card" href="/products"><ShoppingBag size={22} /><h2>Shop again</h2><p>Return to the catalog and add products to your bag.</p></Link>
          <Link className="account-card" href="/"><Home size={22} /><h2>Adhal home</h2><p>Go back to the storefront and featured collection.</p></Link>
        </div>
      </div>
    </main>
  );
}
