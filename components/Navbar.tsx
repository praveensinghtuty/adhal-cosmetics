import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="text-rose-600 font-bold">
          Homemade Cosmetics
        </Link>

        {/* Links */}
        <div className="space-x-6">
          <Link href="/" className="text-gray-700 hover:text-rose-600">
            Home
          </Link>
          <Link href="/products" className="text-gray-700 hover:text-rose-600">
            Products
          </Link>
        </div>
      </div>
    </nav>
  );
}
