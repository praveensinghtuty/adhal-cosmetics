"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, ShoppingBag } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-inner">
        {/* Left */}
        <button className="nav-btn">
          <Menu size={20} color="#2b2b2b" strokeWidth={1.5} />
        </button>

        {/* Center */}
        <div className="nav-brand">
          <span className="brand-main">ADHAL</span>
          <span className="brand-sub">Cosmetics</span>
        </div>

        {/* Right */}
        <button className="nav-btn" onClick={() => router.push("/products")}>
          <ShoppingBag size={20} color="#2b2b2b" strokeWidth={1.5} />
        </button>
      </div>
    </nav>
  );
}
