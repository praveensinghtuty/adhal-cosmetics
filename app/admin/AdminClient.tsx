"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
    value: any
  ) => {
    await supabase
      .from("products")
      .update({ [field]: value })
      .eq("id", id);
  };

  /* ---------------- UI ---------------- */

  if (loading) {
    return <div className="p-10 text-center">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
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
    <div className="min-h-screen bg-stone-50 px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin – Products</h1>
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
