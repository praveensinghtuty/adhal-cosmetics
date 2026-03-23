"use client";

import { usePathname, useRouter } from "next/navigation";

export default function SideDrawer({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (path: string) => {
    router.push(path);
    onClose();
  };

  const menu = [
    { label: "Home", path: "/" },
    { label: "Products", path: "/products" },
    { label: "Reviews", path: "/reviews" },
  ];

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="drawer-header">
          <div>
            <div className="brand-main">Adhal</div>
            <div className="brand-sub">Cosmetics</div>
          </div>

          <button className="drawer-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="drawer-divider" />

        {/* MENU */}
        <div className="drawer-menu">
          {menu.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`drawer-item ${
                pathname === item.path ? "active" : ""
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
