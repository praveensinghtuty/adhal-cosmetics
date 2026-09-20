"use client";

import { BarChart3, Home, LayoutDashboard, MapPin, Package, Percent, ShoppingBag, Star, Store, User, X } from "lucide-react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const sections = [
  {
    title: "Shop",
    items: [
      { label: "Home", path: "/", icon: Home, exact: true },
      { label: "Shop all", path: "/products", icon: ShoppingBag },
      { label: "Reviews", path: "/reviews", icon: Star },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Dashboard", path: "/account", icon: User, exact: true },
      { label: "Orders", path: "/account/orders", icon: Package },
      { label: "Addresses", path: "/account/addresses", icon: MapPin },
    ],
  },
  {
    title: "Admin",
    items: [
      { label: "Overview", path: "/admin", icon: LayoutDashboard, exact: true },
      { label: "Products", path: "/admin/products", icon: Store },
      { label: "Sales", path: "/admin/sales", icon: Percent },
      { label: "Orders", path: "/admin/orders", icon: Package },
      { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
    ],
  },
];

export default function SideDrawer({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const isActive = (path: string, exact?: boolean) => exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
  const navigate = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <aside className="drawer" onClick={(event) => event.stopPropagation()} aria-label="Site menu">
        <div className="drawer-header">
          <div className="nav-brand"><span className="brand-main">Adhal</span><span className="brand-sub">Cosmetics</span></div>
          <button className="icon-button" onClick={onClose} aria-label="Close menu"><X size={19} /></button>
        </div>

        <nav className="drawer-menu">
          {sections.map((section) => (
            <section className="drawer-section" key={section.title}>
              <p>{section.title}</p>
              <div>
                {section.items.map(({ label, path, icon: Icon, exact }) => (
                  <button key={path} onClick={() => navigate(path)} className={`drawer-item ${isActive(path, exact) ? "active" : ""}`}>
                    <Icon size={18} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </nav>

        <p className="drawer-foot">Thoughtful herbal care, handmade in small batches with ingredients you can trust.</p>
      </aside>
    </div>
  );
}
