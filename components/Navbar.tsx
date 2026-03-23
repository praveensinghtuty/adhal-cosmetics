"use client";

import { useState } from "react";
import { Menu, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import SideDrawer from "./SideDrawer";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <nav className="navbar">
        <div className="nav-inner">
          {/* Left */}
          <button className="nav-btn" onClick={() => setOpen(true)}>
            <Menu size={20} strokeWidth={1.5} />
          </button>

          {/* Center */}
          <div className="nav-brand">
            <span className="brand-main">Adhal</span>
            <span className="brand-sub">Cosmetics</span>
          </div>

          {/* Right */}
          <button className="nav-btn" onClick={() => router.push("/products")}>
            <ShoppingBag size={20} strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {/* Drawer */}
      {open && <SideDrawer onClose={() => setOpen(false)} />}
    </>
  );
}
