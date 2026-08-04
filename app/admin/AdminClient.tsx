"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

<style jsx global>{`
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-text-fill-color: #111827; /* gray-900 */
    transition: background-color 5000s ease-in-out 0s;
  }
`}</style>;

type Product = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  tags: string[];
  is_active: boolean;
  sale_name: string | null;
  discount_percentage: number | null;
};

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 " +
  "bg-white text-gray-900 placeholder-gray-400 " +
  "focus:outline-none focus:ring-2 focus:ring-rose-500";

const getFilePathFromUrl = (url: string) => {
  const parts = url.split("/storage/v1/object/public/product-images/");
  return parts[1] || null;
};

export default function AdminClient() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saleForm, setSaleForm] = useState({ name: "", discount: "" });
  const [selectedSaleProducts, setSelectedSaleProducts] = useState<string[]>([]);
  const [savingSale, setSavingSale] = useState(false);
  const [saleMessage, setSaleMessage] = useState<string | null>(null);

  // login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [tempImagePath, setTempImagePath] = useState<string | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

  // add product form
  const [form, setForm] = useState({
    name: "",
    price: "",
    image_url: "",
    tags: "",
    is_active: true,
  });

  /* ---------------- AUTH ---------------- */

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ---------------- FETCH PRODUCTS ---------------- */

  useEffect(() => {
    if (!user) return;

    supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProducts(data || []);
      });
  }, [user]);

  useEffect(() => {
    return () => {
      if (tempImagePath) {
        supabase.storage.from("product-images").remove([tempImagePath]);
      }
    };
  }, [tempImagePath]);

  /* ---------------- ACTIONS ---------------- */

  const login = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const replaceProductImage = async (
    productId: string,
    oldImageUrl: string | null,
    file: File
  ) => {
    // delete old image
    if (oldImageUrl) {
      const oldPath = getFilePathFromUrl(oldImageUrl);
      if (oldPath) {
        await supabase.storage.from("product-images").remove([oldPath]);
      }
    }

    // upload new image
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file);

    if (error) {
      alert("Image upload failed");
      return;
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    // update product
    await supabase
      .from("products")
      .update({ image_url: data.publicUrl })
      .eq("id", productId);
  };

  const uploadTempImage = async (file: File) => {
    // delete previous temp image if exists
    if (tempImagePath) {
      await supabase.storage.from("product-images").remove([tempImagePath]);
    }

    const ext = file.name.split(".").pop();
    const fileName = `temp/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file);

    if (error) {
      alert("Image upload failed");
      return;
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    setTempImagePath(fileName);
    setTempImageUrl(data.publicUrl);
  };

  const addProduct = async () => {
    if (!form.name || !form.price) return;

    await supabase.from("products").insert({
      name: form.name,
      price: Number(form.price),
      image_url: tempImageUrl,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      is_active: true,
    });

    // reset temp image state (image is now permanent)
    setTempImagePath(null);
    setTempImageUrl(null);

    setForm({
      name: "",
      price: "",
      image_url: "",
      tags: "",
      is_active: true,
    });

    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    setProducts(data || []);
  };

  const updateProduct = async (
    id: string,
    field: keyof Product,
    value: Product[keyof Product]
  ) => {
    await supabase
      .from("products")
      .update({ [field]: value })
      .eq("id", id);
  };

  const applySale = async () => {
    const name = saleForm.name.trim();
    const discount = Number(saleForm.discount);
    if (!name || discount <= 0 || discount >= 100 || selectedSaleProducts.length === 0) {
      setSaleMessage("Enter a sale name, a discount from 1 to 99, and choose at least one product.");
      return;
    }

    setSavingSale(true);
    setSaleMessage(null);
    const { error } = await supabase
      .from("products")
      .update({ sale_name: name, discount_percentage: discount })
      .in("id", selectedSaleProducts);

    if (error) {
      setSaleMessage(error.message);
    } else {
      setProducts((current) => current.map((product) => selectedSaleProducts.includes(product.id)
        ? { ...product, sale_name: name, discount_percentage: discount }
        : product));
      setSaleMessage(`Sale applied to ${selectedSaleProducts.length} product${selectedSaleProducts.length === 1 ? "" : "s"}.`);
    }
    setSavingSale(false);
  };

  const clearSale = async () => {
    if (selectedSaleProducts.length === 0) {
      setSaleMessage("Choose at least one product to remove from sale.");
      return;
    }
    setSavingSale(true);
    setSaleMessage(null);
    const { error } = await supabase
      .from("products")
      .update({ sale_name: null, discount_percentage: null })
      .in("id", selectedSaleProducts);
    if (error) setSaleMessage(error.message);
    else {
      setProducts((current) => current.map((product) => selectedSaleProducts.includes(product.id)
        ? { ...product, sale_name: null, discount_percentage: null }
        : product));
      setSaleMessage("Sale removed from the selected products.");
    }
    setSavingSale(false);
  };

  const allProductsSelected = products.length > 0 && selectedSaleProducts.length === products.length;
  const toggleAllSaleProducts = () => setSelectedSaleProducts(allProductsSelected ? [] : products.map((product) => product.id));

  /* ---------------- UI ---------------- */

  if (loading) {
    return <div className="p-10 text-center">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white border border-gray-300 rounded-xl p-6 shadow-sm mx-auto space-y-10">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">
            Admin Login
          </h1>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />

          <button
            onClick={login}
            className="w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-black"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin – Products & Sales</h1>
          <button
            onClick={logout}
            className="
            text-sm font-semibold
            border border-gray-400
            px-4 py-2
            rounded-lg
            text-gray-800
            bg-white
            shadow-sm
            hover:bg-rose-50
            hover:border-rose-400
            hover:text-rose-600
            transition
          "
          >
            Logout
          </button>
        </div>

        {/* Add Product */}
        <div className="bg-white border border-gray-300 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900">Add New Product</h2>

          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
          />

          <input
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className={inputClass}
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (!e.target.files?.[0]) return;
              uploadTempImage(e.target.files[0]);
            }}
            className={inputClass}
          />

          {tempImageUrl && (
            <img
              src={tempImageUrl}
              alt="Preview"
              className="h-24 rounded border"
            />
          )}

          <input
            placeholder="Tags (comma separated)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className={inputClass}
          />

          <button
            onClick={addProduct}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Add Product
          </button>
        </div>

        {/* Sales */}
        <section className="bg-white border border-gray-300 rounded-xl p-6 shadow-sm space-y-5">
          <div>
            <h2 className="font-semibold text-gray-900">Create a sale</h2>
            <p className="mt-1 text-sm text-gray-500">Choose products, then apply one sale name and discount to all of them.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm font-medium text-gray-700">Sale name
              <input value={saleForm.name} onChange={(e) => setSaleForm({ ...saleForm, name: e.target.value })} placeholder="Summer Sale" className={inputClass + " mt-1"} />
            </label>
            <label className="text-sm font-medium text-gray-700">Discount percentage
              <input type="number" min="1" max="99" value={saleForm.discount} onChange={(e) => setSaleForm({ ...saleForm, discount: e.target.value })} placeholder="20" className={inputClass + " mt-1"} />
            </label>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-800 cursor-pointer">
              <input type="checkbox" checked={allProductsSelected} onChange={toggleAllSaleProducts} className="w-5 h-5 accent-rose-600" />
              Select all products <span className="ml-auto text-xs font-normal text-gray-500">{selectedSaleProducts.length} selected</span>
            </label>
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
              {products.map((product) => <label key={product.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-rose-50">
                <input type="checkbox" checked={selectedSaleProducts.includes(product.id)} onChange={() => setSelectedSaleProducts((current) => current.includes(product.id) ? current.filter((id) => id !== product.id) : [...current, product.id])} className="w-5 h-5 accent-rose-600" />
                <span className="text-sm font-medium text-gray-900">{product.name}</span>
                {product.sale_name && <span className="ml-auto rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">{product.sale_name} · {product.discount_percentage}%</span>}
              </label>)}
            </div>
          </div>
          {saleMessage && <p className={`text-sm ${saleMessage.includes("applied") || saleMessage.includes("removed") ? "text-green-700" : "text-red-600"}`}>{saleMessage}</p>}
          <div className="flex flex-wrap gap-3">
            <button disabled={savingSale} onClick={applySale} className="bg-rose-600 text-white px-5 py-2 rounded-lg hover:bg-rose-700 disabled:opacity-50">{savingSale ? "Saving…" : "Apply sale"}</button>
            <button disabled={savingSale} onClick={clearSale} className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50">Remove sale from selected</button>
          </div>
        </section>

        {/* Products List */}
        <div className="space-y-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="
              bg-white border border-gray-300 rounded-xl p-4 shadow-sm
              grid grid-cols-1 md:grid-cols-12 gap-4 items-center
            "
            >
              {/* Name */}
              <input
                defaultValue={p.name}
                onBlur={(e) => updateProduct(p.id, "name", e.target.value)}
                className={inputClass + " md:col-span-3"}
              />

              {/* Price */}
              <input
                type="number"
                defaultValue={p.price}
                onBlur={(e) =>
                  updateProduct(p.id, "price", Number(e.target.value))
                }
                className={inputClass + " md:col-span-2"}
              />

              {/* Image */}
              <div className="md:col-span-3 flex items-center gap-3">
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="h-14 w-14 object-cover rounded border"
                  />
                )}

                <label className="cursor-pointer text-sm text-rose-600 font-medium">
                  Change
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      if (!e.target.files?.[0]) return;
                      await replaceProductImage(
                        p.id,
                        p.image_url,
                        e.target.files[0]
                      );
                    }}
                  />
                </label>
              </div>

              {/* Tags */}
              <input
                defaultValue={p.tags.join(",")}
                onBlur={(e) =>
                  updateProduct(
                    p.id,
                    "tags",
                    e.target.value.split(",").map((t) => t.trim())
                  )
                }
                className={inputClass + " md:col-span-3"}
              />

              {/* Active */}
              <div className="md:col-span-1 flex justify-center">
                <input
                  type="checkbox"
                  defaultChecked={p.is_active}
                  onChange={(e) =>
                    updateProduct(p.id, "is_active", e.target.checked)
                  }
                  className="w-5 h-5 accent-green-600"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
