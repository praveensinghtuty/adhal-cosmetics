"use client";

import { ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProductSearch({ initialValue = "" }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  const router = useRouter();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = value.trim();
    router.push(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
  };

  return <form className="top-search" onSubmit={submit} role="search">
    <Search size={18} aria-hidden="true" />
    <input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Search soaps, oils, creams..." aria-label="Search products" />
    <button type="submit" aria-label="View matching products"><ArrowRight size={18} /></button>
  </form>;
}
