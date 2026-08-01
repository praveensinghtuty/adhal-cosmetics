"use client";

import Link from "next/link";
import { Menu, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import SideDrawer from "./SideDrawer";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`} aria-label="Main navigation">
        <div className="nav-inner">
          <div className="nav-links">
            <Link className={`nav-link ${pathname === "/" ? "active" : ""}`} href="/">Home</Link>
            <Link className={`nav-link ${pathname === "/products" ? "active" : ""}`} href="/products">Shop</Link>
            <Link className={`nav-link ${pathname === "/reviews" ? "active" : ""}`} href="/reviews">Reviews</Link>
          </div>
          <button className="nav-btn menu-button" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <Link href="/" className="nav-brand" aria-label="Adhal Cosmetics home">
            <span className="brand-main">Adhal</span><span className="brand-sub">Cosmetics</span>
          </Link>
          <div className="nav-actions">
            <button className="nav-btn" onClick={() => router.push("/products")} aria-label="Shop products"><ShoppingBag size={19} /></button>
          </div>
        </div>
      </nav>
      {open && <SideDrawer onClose={() => setOpen(false)} />}
    </>
  );
}
