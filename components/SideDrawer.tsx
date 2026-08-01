"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function SideDrawer({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const menu = [{ label: "Home", path: "/" }, { label: "Shop all", path: "/products" }, { label: "Customer stories", path: "/reviews" }];
  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <aside className="drawer" onClick={(e) => e.stopPropagation()} aria-label="Site menu">
        <div className="drawer-header"><div className="nav-brand"><span className="brand-main">Adhal</span><span className="brand-sub">Cosmetics</span></div><button className="icon-button" onClick={onClose} aria-label="Close menu"><X size={19} /></button></div>
        <nav className="drawer-menu">{menu.map((item) => <button key={item.path} onClick={() => { router.push(item.path); onClose(); }} className={`drawer-item ${pathname === item.path ? "active" : ""}`}>{item.label}</button>)}</nav>
        <p className="drawer-foot">Thoughtful herbal care, handmade in small batches with ingredients you can trust.</p>
      </aside>
    </div>
  );
}
