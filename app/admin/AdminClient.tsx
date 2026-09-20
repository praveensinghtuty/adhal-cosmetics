"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BarChart3, Boxes, ClipboardList, PackagePlus, Percent, ToggleLeft } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { formatPrice } from "@/lib/sales";
import { supabase } from "@/lib/supabaseClient";

export type AdminSection = "overview" | "add-product" | "products" | "sales" | "orders" | "analytics";

type Product = {
  id: string;
  name: string;
  description: string | null;
  short_description: string | null;
  benefits: string[] | null;
  ingredients: string[] | null;
  how_to_use: string[] | null;
  best_for: string[] | null;
  net_weight: string | null;
  shelf_life: string | null;
  price: number;
  image_url: string | null;
  tags: string[];
  is_active: boolean;
  sale_name: string | null;
  discount_percentage: number | null;
  product_images?: ProductImage[];
};

type ProductImage = {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
};

type PendingProductImage = {
  path: string;
  url: string;
};

type StoreOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  order_items: { id: string; product_name: string; quantity: number; line_total: number }[];
};

type AnalyticsEvent = {
  id: string;
  event_name: string;
  properties: { total_amount?: number; item_count?: number };
  created_at: string;
};

type ProductForm = {
  name: string;
  price: string;
  image_url: string;
  tags: string;
  short_description: string;
  description: string;
  benefits: string;
  ingredients: string;
  how_to_use: string;
  best_for: string;
  net_weight: string;
  shelf_life: string;
  is_active: boolean;
};

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500";

const navItems = [
  { section: "overview", label: "Overview", href: "/admin", icon: Boxes },
  { section: "add-product", label: "Add product", href: "/admin/products/new", icon: PackagePlus },
  { section: "products", label: "Products", href: "/admin/products", icon: ToggleLeft },
  { section: "sales", label: "Create sale", href: "/admin/sales", icon: Percent },
  { section: "orders", label: "Order queue", href: "/admin/orders", icon: ClipboardList },
  { section: "analytics", label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
] as const;

const getFilePathFromUrl = (url: string) => {
  const parts = url.split("/storage/v1/object/public/product-images/");
  return parts[1] || null;
};

const splitList = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);
const listText = (value?: string[] | null) => (value || []).join("\n");

export default function AdminClient({ section = "overview" }: { section?: AdminSection }) {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saleForm, setSaleForm] = useState({ name: "", discount: "" });
  const [selectedSaleProducts, setSelectedSaleProducts] = useState<string[]>([]);
  const [savingSale, setSavingSale] = useState(false);
  const [saleMessage, setSaleMessage] = useState<string | null>(null);
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tempImagePath, setTempImagePath] = useState<string | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [tempGalleryImages, setTempGalleryImages] = useState<PendingProductImage[]>([]);
  const tempImagePathRef = useRef<string | null>(null);
  const tempGalleryImagesRef = useRef<PendingProductImage[]>([]);
  const [form, setForm] = useState<ProductForm>({
    name: "",
    price: "",
    image_url: "",
    tags: "",
    short_description: "",
    description: "",
    benefits: "",
    ingredients: "",
    how_to_use: "",
    best_for: "",
    net_weight: "",
    shelf_life: "",
    is_active: true,
  });

  async function getOperationsData() {
    const [{ data: orderData }, { data: eventData }] = await Promise.all([
      supabase
        .from("orders")
        .select("id,order_number,customer_name,customer_phone,address_line1,address_line2,city,state,pincode,status,payment_status,total_amount,created_at,order_items(id,product_name,quantity,line_total)")
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("analytics_events")
        .select("id,event_name,properties,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    return {
      orderData: (orderData as StoreOrder[]) || [],
      eventData: (eventData as AnalyticsEvent[]) || [],
    };
  }

  async function fetchProducts() {
    const { data } = await supabase
      .from("products")
      .select("*,product_images(id,image_url,alt_text,sort_order,is_primary)")
      .order("created_at", { ascending: false });
    setProducts(data || []);
  }

  async function fetchOperations() {
    const { orderData, eventData } = await getOperationsData();
    setOrders(orderData);
    setAnalyticsEvents(eventData);
  }

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

  useEffect(() => {
    if (!user) return;

    supabase.from("products").select("*,product_images(id,image_url,alt_text,sort_order,is_primary)").order("created_at", { ascending: false }).then(({ data }) => {
      setProducts(data || []);
    });

    getOperationsData().then(({ orderData, eventData }) => {
      setOrders(orderData);
      setAnalyticsEvents(eventData);
    });
  }, [user]);

  useEffect(() => { tempImagePathRef.current = tempImagePath; }, [tempImagePath]);
  useEffect(() => { tempGalleryImagesRef.current = tempGalleryImages; }, [tempGalleryImages]);
  useEffect(() => () => {
    const paths = [
      tempImagePathRef.current,
      ...tempGalleryImagesRef.current.map((image) => image.path),
    ].filter(Boolean) as string[];
    if (paths.length) supabase.storage.from("product-images").remove(paths);
  }, []);

  const login = async () => {
    setError(null);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) setError(loginError.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const uploadTempImage = async (file: File) => {
    if (tempImagePath) await supabase.storage.from("product-images").remove([tempImagePath]);

    const ext = file.name.split(".").pop();
    const fileName = `temp/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, file);

    if (uploadError) {
      alert("Image upload failed");
      return;
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
    tempImagePathRef.current = fileName;
    setTempImagePath(fileName);
    setTempImageUrl(data.publicUrl);
  };

  const uploadTempGalleryImages = async (files: FileList) => {
    const uploadedImages: PendingProductImage[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const fileName = `temp/gallery/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, file);

      if (uploadError) {
        alert(`Gallery image upload failed for ${file.name}`);
        continue;
      }

      const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
      uploadedImages.push({ path: fileName, url: data.publicUrl });
    }

    if (uploadedImages.length) {
      setTempGalleryImages((current) => {
        const next = [...current, ...uploadedImages];
        tempGalleryImagesRef.current = next;
        return next;
      });
    }
  };

  const removeTempGalleryImage = async (path: string) => {
    await supabase.storage.from("product-images").remove([path]);
    setTempGalleryImages((current) => {
      const next = current.filter((image) => image.path !== path);
      tempGalleryImagesRef.current = next;
      return next;
    });
  };

  const replaceProductImage = async (productId: string, oldImageUrl: string | null, file: File) => {
    if (oldImageUrl) {
      const oldPath = getFilePathFromUrl(oldImageUrl);
      if (oldPath) await supabase.storage.from("product-images").remove([oldPath]);
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, file);

    if (uploadError) {
      alert("Image upload failed");
      return;
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
    await supabase.from("products").update({ image_url: data.publicUrl }).eq("id", productId);
    await fetchProducts();
  };

  const addProduct = async () => {
    if (!form.name || !form.price) return;

    const primaryImageUrl = tempImageUrl || tempGalleryImages[0]?.url || null;
    const { data: createdProduct, error: productError } = await supabase.from("products").insert({
      name: form.name,
      price: Number(form.price),
      image_url: primaryImageUrl,
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      short_description: form.short_description.trim() || null,
      description: form.description.trim() || null,
      benefits: splitList(form.benefits),
      ingredients: splitList(form.ingredients),
      how_to_use: splitList(form.how_to_use),
      best_for: splitList(form.best_for),
      net_weight: form.net_weight.trim() || null,
      shelf_life: form.shelf_life.trim() || null,
      is_active: true,
    }).select("id,name").single();

    if (productError || !createdProduct) {
      alert(productError?.message || "Product was not created");
      return;
    }

    if (tempGalleryImages.length) {
      const galleryRows = tempGalleryImages.map((image, index) => ({
        product_id: createdProduct.id,
        image_url: image.url,
        alt_text: form.name,
        sort_order: index,
        is_primary: image.url === primaryImageUrl,
      }));
      await supabase.from("product_images").insert(galleryRows);
    }

    tempImagePathRef.current = null;
    tempGalleryImagesRef.current = [];
    setTempImagePath(null);
    setTempImageUrl(null);
    setTempGalleryImages([]);
    setForm({ name: "", price: "", image_url: "", tags: "", short_description: "", description: "", benefits: "", ingredients: "", how_to_use: "", best_for: "", net_weight: "", shelf_life: "", is_active: true });
    await fetchProducts();
  };

  const updateProduct = async (id: string, field: keyof Product, value: Product[keyof Product]) => {
    await supabase.from("products").update({ [field]: value }).eq("id", id);
    setProducts((current) => current.map((product) => product.id === id ? { ...product, [field]: value } : product));
  };

  const uploadProductGalleryImage = async (product: Product, file: File) => {
    const ext = file.name.split(".").pop();
    const fileName = `gallery/${product.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, file);
    if (uploadError) {
      alert("Gallery image upload failed");
      return;
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
    await supabase.from("product_images").insert({
      product_id: product.id,
      image_url: data.publicUrl,
      alt_text: product.name,
      sort_order: product.product_images?.length || 0,
      is_primary: !product.product_images?.length && !product.image_url,
    });
    if (!product.image_url) await supabase.from("products").update({ image_url: data.publicUrl }).eq("id", product.id);
    await fetchProducts();
  };

  const removeProductGalleryImage = async (image: ProductImage) => {
    const path = getFilePathFromUrl(image.image_url);
    await supabase.from("product_images").delete().eq("id", image.id);
    if (path) await supabase.storage.from("product-images").remove([path]);
    await fetchProducts();
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    setOrderMessage(null);
    const { data, error: updateError } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select("id,status")
      .single();

    if (updateError || !data) {
      setOrderMessage(updateError?.message || "Status was not updated. This admin account may not have order update access.");
      return;
    }

    setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status: data.status } : order));
    await fetchOperations();
    setOrderMessage(`Order status changed to ${status}.`);
  };

  const updatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    setOrderMessage(null);
    const { data, error: updateError } = await supabase
      .from("orders")
      .update({ payment_status: paymentStatus })
      .eq("id", orderId)
      .select("id,payment_status")
      .single();

    if (updateError || !data) {
      setOrderMessage(updateError?.message || "Payment status was not updated. This admin account may not have order update access.");
      return;
    }

    setOrders((current) => current.map((order) => order.id === orderId ? { ...order, payment_status: data.payment_status } : order));
    await fetchOperations();
    setOrderMessage(`Payment status changed to ${paymentStatus}.`);
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
    const { error: saleError } = await supabase.from("products").update({ sale_name: name, discount_percentage: discount }).in("id", selectedSaleProducts);

    if (saleError) {
      setSaleMessage(saleError.message);
    } else {
      setProducts((current) => current.map((product) => selectedSaleProducts.includes(product.id) ? { ...product, sale_name: name, discount_percentage: discount } : product));
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
    const { error: clearError } = await supabase.from("products").update({ sale_name: null, discount_percentage: null }).in("id", selectedSaleProducts);

    if (clearError) setSaleMessage(clearError.message);
    else {
      setProducts((current) => current.map((product) => selectedSaleProducts.includes(product.id) ? { ...product, sale_name: null, discount_percentage: null } : product));
      setSaleMessage("Sale removed from the selected products.");
    }
    setSavingSale(false);
  };

  const allProductsSelected = products.length > 0 && selectedSaleProducts.length === products.length;
  const toggleAllSaleProducts = () => setSelectedSaleProducts(allProductsSelected ? [] : products.map((product) => product.id));
  const pendingOrders = orders.filter((order) => !["delivered", "cancelled"].includes(order.status)).length;
  const manualRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const createdOrderEvents = analyticsEvents.filter((event) => event.event_name === "order_created").length;
  const activeProducts = products.filter((product) => product.is_active).length;
  const inactiveProducts = products.length - activeProducts;

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white border border-gray-300 rounded-xl p-6 shadow-sm mx-auto space-y-5">
          <h1 className="text-xl font-semibold text-gray-900">Admin Login</h1>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
          <input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
          <button onClick={login} className="w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-black">Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] px-3 pt-24 pb-10 sm:px-4 sm:pt-28">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-wrap justify-between items-start gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-700">Admin</p>
            <h1 className="mt-1 text-xl sm:text-2xl font-bold text-gray-900">{navItems.find((item) => item.section === section)?.label || "Overview"}</h1>
          </div>
          <button onClick={logout} className="text-xs sm:text-sm font-semibold border border-gray-300 px-3 sm:px-4 py-2 rounded-full text-gray-800 bg-white shadow-sm hover:bg-rose-50 hover:border-rose-400 hover:text-rose-600 transition">Logout</button>
        </header>

        <nav className="-mx-3 mt-5 flex gap-2 overflow-x-auto px-3 pb-2 snap-x scrollbar-hide sm:mx-0 sm:px-0">
          {navItems.map(({ section: navSection, label, href, icon: Icon }) => (
            <Link key={navSection} href={href} className={`min-h-10 shrink-0 snap-start px-3 sm:px-4 rounded-full border inline-flex items-center gap-2 whitespace-nowrap text-xs sm:text-sm font-semibold shadow-sm ${section === navSection ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 sm:mt-8">
          {section === "overview" && <OverviewSection products={products} pendingOrders={pendingOrders} manualRevenue={manualRevenue} createdOrderEvents={createdOrderEvents} activeProducts={activeProducts} inactiveProducts={inactiveProducts} />}
          {section === "add-product" && <AddProductSection form={form} setForm={setForm} tempImageUrl={tempImageUrl} tempGalleryImages={tempGalleryImages} uploadTempImage={uploadTempImage} uploadTempGalleryImages={uploadTempGalleryImages} removeTempGalleryImage={removeTempGalleryImage} addProduct={addProduct} />}
          {section === "products" && <ProductsSection products={products} updateProduct={updateProduct} replaceProductImage={replaceProductImage} uploadProductGalleryImage={uploadProductGalleryImage} removeProductGalleryImage={removeProductGalleryImage} />}
          {section === "sales" && <SalesSection products={products} saleForm={saleForm} setSaleForm={setSaleForm} selectedSaleProducts={selectedSaleProducts} setSelectedSaleProducts={setSelectedSaleProducts} allProductsSelected={allProductsSelected} toggleAllSaleProducts={toggleAllSaleProducts} savingSale={savingSale} saleMessage={saleMessage} applySale={applySale} clearSale={clearSale} />}
          {section === "orders" && <OrdersSection orders={orders} orderMessage={orderMessage} updateOrderStatus={updateOrderStatus} updatePaymentStatus={updatePaymentStatus} fetchOperations={fetchOperations} />}
          {section === "analytics" && <AnalyticsSection orders={orders} analyticsEvents={analyticsEvents} pendingOrders={pendingOrders} manualRevenue={manualRevenue} createdOrderEvents={createdOrderEvents} activeProducts={activeProducts} />}
        </div>
      </div>
    </div>
  );
}

function AdminCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`bg-white border border-gray-200 rounded-2xl p-4 shadow-sm sm:p-6 ${className}`}>{children}</section>;
}

function OverviewSection({ products, pendingOrders, manualRevenue, createdOrderEvents, activeProducts, inactiveProducts }: { products: Product[]; pendingOrders: number; manualRevenue: number; createdOrderEvents: number; activeProducts: number; inactiveProducts: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
      <Metric title="Open orders" value={pendingOrders} tone="rose" />
      <Metric title="Recorded sales" value={`₹${formatPrice(manualRevenue)}`} tone="green" />
      <Metric title="Checkout events" value={createdOrderEvents} tone="blue" />
      <AdminCard className="col-span-2 lg:col-span-3">
        <h2 className="font-semibold text-gray-900">Admin utilities</h2>
        <p className="mt-1 text-sm text-gray-500">Use the navigation above to work on one task at a time.</p>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="rounded-xl bg-gray-50 p-4"><p className="text-sm text-gray-500">Products</p><strong className="text-2xl text-gray-900">{products.length}</strong></div>
          <div className="rounded-xl bg-gray-50 p-4"><p className="text-sm text-gray-500">Active products</p><strong className="text-2xl text-gray-900">{activeProducts}</strong></div>
          <div className="col-span-2 rounded-xl bg-gray-50 p-4 md:col-span-1"><p className="text-sm text-gray-500">Hidden products</p><strong className="text-2xl text-gray-900">{inactiveProducts}</strong></div>
        </div>
      </AdminCard>
    </div>
  );
}

function Metric({ title, value, tone }: { title: string; value: string | number; tone: "rose" | "green" | "blue" }) {
  const toneClass = tone === "rose" ? "bg-rose-50 text-rose-700" : tone === "green" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700";
  return <div className={`min-h-24 rounded-2xl p-4 ${toneClass} sm:p-5`}><p className="text-[10px] font-bold uppercase tracking-wide sm:text-xs">{title}</p><strong className="mt-2 block text-2xl text-gray-900 sm:text-3xl">{value}</strong></div>;
}

function AddProductSection({
  form,
  setForm,
  tempImageUrl,
  tempGalleryImages,
  uploadTempImage,
  uploadTempGalleryImages,
  removeTempGalleryImage,
  addProduct,
}: {
  form: ProductForm;
  setForm: React.Dispatch<React.SetStateAction<ProductForm>>;
  tempImageUrl: string | null;
  tempGalleryImages: PendingProductImage[];
  uploadTempImage: (file: File) => Promise<void>;
  uploadTempGalleryImages: (files: FileList) => Promise<void>;
  removeTempGalleryImage: (path: string) => Promise<void>;
  addProduct: () => Promise<void>;
}) {
  return (
    <AdminCard className="max-w-3xl space-y-4">
      <div><h2 className="font-semibold text-gray-900">Add new product</h2><p className="mt-1 text-sm text-gray-500">Create a product with rich details, primary image, and gallery images.</p></div>
      <input placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} />
      <input placeholder="Price" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className={inputClass} />
      <input placeholder="Short description" value={form.short_description} onChange={(event) => setForm({ ...form, short_description: event.target.value })} className={inputClass} />
      <textarea placeholder="Long description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={inputClass + " min-h-24"} />
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">Primary image</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">Used on product cards and as the main image on the detail page.</p>
          <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-gray-900 px-4 text-sm font-bold text-white">
            Choose primary
            <input type="file" accept="image/*" onChange={(event) => { if (event.target.files?.[0]) uploadTempImage(event.target.files[0]); }} className="hidden" />
          </label>
          {tempImageUrl && <img src={tempImageUrl} alt="Primary preview" className="mt-3 h-28 w-28 object-cover rounded-xl border bg-white" />}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Gallery images</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">Add multiple images for the product detail gallery.</p>
          <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-gray-300 bg-white px-4 text-sm font-bold text-gray-800">
            Add gallery images
            <input type="file" accept="image/*" multiple onChange={(event) => { if (event.target.files?.length) uploadTempGalleryImages(event.target.files); event.currentTarget.value = ""; }} className="hidden" />
          </label>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {tempGalleryImages.map((image) => (
              <div key={image.path} className="relative overflow-hidden rounded-xl border bg-white">
                <img src={image.url} alt="Gallery preview" className="aspect-square w-full object-cover" />
                <button type="button" onClick={() => removeTempGalleryImage(image.path)} className="absolute bottom-1 left-1 right-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-red-600">Remove</button>
              </div>
            ))}
            {!tempGalleryImages.length && <p className="col-span-full text-xs leading-5 text-gray-500">No gallery images selected yet.</p>}
          </div>
        </div>
      </div>
      <input placeholder="Tags (comma separated)" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} className={inputClass} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <textarea placeholder="Benefits (one per line)" value={form.benefits} onChange={(event) => setForm({ ...form, benefits: event.target.value })} className={inputClass + " min-h-28"} />
        <textarea placeholder="Ingredients (one per line)" value={form.ingredients} onChange={(event) => setForm({ ...form, ingredients: event.target.value })} className={inputClass + " min-h-28"} />
        <textarea placeholder="How to use (one step per line)" value={form.how_to_use} onChange={(event) => setForm({ ...form, how_to_use: event.target.value })} className={inputClass + " min-h-28"} />
        <textarea placeholder="Best for (one per line)" value={form.best_for} onChange={(event) => setForm({ ...form, best_for: event.target.value })} className={inputClass + " min-h-28"} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input placeholder="Net weight / size" value={form.net_weight} onChange={(event) => setForm({ ...form, net_weight: event.target.value })} className={inputClass} />
        <input placeholder="Shelf life" value={form.shelf_life} onChange={(event) => setForm({ ...form, shelf_life: event.target.value })} className={inputClass} />
      </div>
      <button onClick={addProduct} className="w-full bg-green-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-green-700 sm:w-auto sm:py-2">Add product</button>
    </AdminCard>
  );
}

function ProductsSection({ products, updateProduct, replaceProductImage, uploadProductGalleryImage, removeProductGalleryImage }: { products: Product[]; updateProduct: (id: string, field: keyof Product, value: Product[keyof Product]) => Promise<void>; replaceProductImage: (productId: string, oldImageUrl: string | null, file: File) => Promise<void>; uploadProductGalleryImage: (product: Product, file: File) => Promise<void>; removeProductGalleryImage: (image: ProductImage) => Promise<void> }) {
  return (
    <AdminCard>
      <div><h2 className="font-semibold text-gray-900">Product visibility and details</h2><p className="mt-1 text-sm text-gray-500">Edit product basics and select or deselect products from the live catalog.</p></div>
      <div className="mt-5 space-y-3">
        {products.map((product) => (
          <div key={product.id} className="grid grid-cols-1 gap-4 border border-gray-200 rounded-xl p-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              <input defaultValue={product.name} onBlur={(event) => updateProduct(product.id, "name", event.target.value)} className={inputClass + " lg:col-span-3"} />
              <input type="number" defaultValue={product.price} onBlur={(event) => updateProduct(product.id, "price", Number(event.target.value))} className={inputClass + " lg:col-span-2"} />
              <div className="lg:col-span-3 flex items-center gap-3">
                {product.image_url && <img src={product.image_url} alt={product.name} className="h-14 w-14 object-cover rounded border" />}
                <label className="cursor-pointer text-sm text-rose-600 font-medium">Change primary<input type="file" accept="image/*" className="hidden" onChange={(event) => { if (event.target.files?.[0]) replaceProductImage(product.id, product.image_url, event.target.files[0]); }} /></label>
              </div>
              <input defaultValue={product.tags.join(",")} onBlur={(event) => updateProduct(product.id, "tags", event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} className={inputClass + " lg:col-span-3"} />
              <label className="lg:col-span-1 flex items-center justify-start gap-2 text-sm text-gray-700 lg:justify-center"><input type="checkbox" checked={product.is_active} onChange={(event) => updateProduct(product.id, "is_active", event.target.checked)} className="w-5 h-5 accent-green-600" /> Live</label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Short description" defaultValue={product.short_description || ""} onBlur={(event) => updateProduct(product.id, "short_description", event.target.value || null)} className={inputClass} />
              <textarea placeholder="Long description" defaultValue={product.description || ""} onBlur={(event) => updateProduct(product.id, "description", event.target.value || null)} className={inputClass + " min-h-24"} />
              <textarea placeholder="Benefits (one per line)" defaultValue={listText(product.benefits)} onBlur={(event) => updateProduct(product.id, "benefits", splitList(event.target.value))} className={inputClass + " min-h-28"} />
              <textarea placeholder="Ingredients (one per line)" defaultValue={listText(product.ingredients)} onBlur={(event) => updateProduct(product.id, "ingredients", splitList(event.target.value))} className={inputClass + " min-h-28"} />
              <textarea placeholder="How to use (one step per line)" defaultValue={listText(product.how_to_use)} onBlur={(event) => updateProduct(product.id, "how_to_use", splitList(event.target.value))} className={inputClass + " min-h-28"} />
              <textarea placeholder="Best for (one per line)" defaultValue={listText(product.best_for)} onBlur={(event) => updateProduct(product.id, "best_for", splitList(event.target.value))} className={inputClass + " min-h-28"} />
              <input placeholder="Net weight / size" defaultValue={product.net_weight || ""} onBlur={(event) => updateProduct(product.id, "net_weight", event.target.value || null)} className={inputClass} />
              <input placeholder="Shelf life" defaultValue={product.shelf_life || ""} onBlur={(event) => updateProduct(product.id, "shelf_life", event.target.value || null)} className={inputClass} />
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-800">Gallery images</p>
                <label className="cursor-pointer rounded-full bg-gray-900 px-4 py-2 text-xs font-bold text-white">Add image<input type="file" accept="image/*" className="hidden" onChange={(event) => { if (event.target.files?.[0]) uploadProductGalleryImage(product, event.target.files[0]); }} /></label>
              </div>
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
                {(product.product_images || []).map((image) => <div key={image.id} className="relative overflow-hidden rounded-xl border bg-white"><img src={image.image_url} alt={image.alt_text || product.name} className="aspect-square w-full object-cover" /><button onClick={() => removeProductGalleryImage(image)} className="absolute bottom-1 left-1 right-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-red-600">Remove</button></div>)}
                {!product.product_images?.length && <p className="col-span-full text-sm text-gray-500">No gallery images yet. The product will use the primary image.</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminCard>
  );
}

function SalesSection({ products, saleForm, setSaleForm, selectedSaleProducts, setSelectedSaleProducts, allProductsSelected, toggleAllSaleProducts, savingSale, saleMessage, applySale, clearSale }: { products: Product[]; saleForm: { name: string; discount: string }; setSaleForm: React.Dispatch<React.SetStateAction<{ name: string; discount: string }>>; selectedSaleProducts: string[]; setSelectedSaleProducts: React.Dispatch<React.SetStateAction<string[]>>; allProductsSelected: boolean; toggleAllSaleProducts: () => void; savingSale: boolean; saleMessage: string | null; applySale: () => Promise<void>; clearSale: () => Promise<void> }) {
  return (
    <AdminCard className="space-y-5">
      <div><h2 className="font-semibold text-gray-900">Create a sale</h2><p className="mt-1 text-sm text-gray-500">Choose products, then apply one sale name and discount to all of them.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="text-sm font-medium text-gray-700">Sale name<input value={saleForm.name} onChange={(event) => setSaleForm({ ...saleForm, name: event.target.value })} placeholder="Summer Sale" className={inputClass + " mt-1"} /></label>
        <label className="text-sm font-medium text-gray-700">Discount percentage<input type="number" min="1" max="99" value={saleForm.discount} onChange={(event) => setSaleForm({ ...saleForm, discount: event.target.value })} placeholder="20" className={inputClass + " mt-1"} /></label>
      </div>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-800 cursor-pointer">
          <input type="checkbox" checked={allProductsSelected} onChange={toggleAllSaleProducts} className="w-5 h-5 accent-rose-600" />
          Select all products <span className="ml-auto text-xs font-normal text-gray-500">{selectedSaleProducts.length} selected</span>
        </label>
        <div className="max-h-[520px] overflow-y-auto divide-y divide-gray-100">
          {products.map((product) => <label key={product.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-rose-50">
            <input type="checkbox" checked={selectedSaleProducts.includes(product.id)} onChange={() => setSelectedSaleProducts((current) => current.includes(product.id) ? current.filter((id) => id !== product.id) : [...current, product.id])} className="w-5 h-5 accent-rose-600" />
            <span className="text-sm font-medium text-gray-900">{product.name}</span>
            {product.sale_name && <span className="ml-auto rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">{product.sale_name} · {product.discount_percentage}%</span>}
          </label>)}
        </div>
      </div>
      {saleMessage && <p className={`text-sm ${saleMessage.includes("applied") || saleMessage.includes("removed") ? "text-green-700" : "text-red-600"}`}>{saleMessage}</p>}
      <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
        <button disabled={savingSale} onClick={applySale} className="bg-rose-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-rose-700 disabled:opacity-50 sm:py-2">{savingSale ? "Saving..." : "Apply sale"}</button>
        <button disabled={savingSale} onClick={clearSale} className="border border-gray-300 text-gray-700 px-5 py-3 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50 sm:py-2">Remove sale from selected</button>
      </div>
    </AdminCard>
  );
}

function OrdersSection({ orders, orderMessage, updateOrderStatus, updatePaymentStatus, fetchOperations }: { orders: StoreOrder[]; orderMessage: string | null; updateOrderStatus: (orderId: string, status: string) => Promise<void>; updatePaymentStatus: (orderId: string, paymentStatus: string) => Promise<void>; fetchOperations: () => Promise<void> }) {
  const labelStatus = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);
  const statusMessages: Record<string, string> = {
    pending: "We received your order and will confirm it shortly.",
    confirmed: "Your order is confirmed. We will start preparing it soon.",
    packed: "Your order is packed and ready for dispatch.",
    shipped: "Your order has been shipped.",
    delivered: "Your order has been delivered. Thank you for shopping with Adhal Cosmetics.",
    cancelled: "Your order has been cancelled. Please contact us if you need help.",
  };

  const getWhatsAppUrl = (order: StoreOrder) => {
    const address = `${order.address_line1}${order.address_line2 ? `, ${order.address_line2}` : ""}, ${order.city}, ${order.state} - ${order.pincode}`;
    const message = encodeURIComponent(
      `Hello ${order.customer_name},\n\nUpdate for order ${order.order_number}:\n${statusMessages[order.status] || "Your order status has been updated."}\n\nItems:\n${order.order_items.map((item) => `${item.product_name} × ${item.quantity} = ₹${formatPrice(item.line_total)}`).join("\n")}\n\nTotal: ₹${formatPrice(order.total_amount)}\nStatus: ${order.status}\nPayment: ${order.payment_status}\n\nDelivery address:\n${address}`
    );
    const phone = order.customer_phone.startsWith("91") ? order.customer_phone : `91${order.customer_phone}`;
    return `https://wa.me/${phone}?text=${message}`;
  };

  return (
    <AdminCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="font-semibold text-gray-900">Order queue</h2><p className="mt-1 text-sm text-gray-500">Review customer orders and move them through fulfilment.</p></div>
        <button onClick={fetchOperations} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-50">Refresh</button>
      </div>
      {orderMessage && <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${orderMessage.includes("changed") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{orderMessage}</p>}
      <div className="mt-5 space-y-3">
        {orders.map((order) => <article key={order.id} className="border border-gray-200 rounded-xl p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{order.order_number}</p>
              <p className="text-sm text-gray-500">{order.customer_name} · {order.customer_phone}</p>
              <p className="mt-2 max-w-2xl rounded-lg bg-gray-50 p-3 text-sm leading-6 text-gray-700">
                <span className="block text-xs font-bold uppercase tracking-wide text-gray-500">Delivery address</span>
                {order.address_line1}{order.address_line2 ? `, ${order.address_line2}` : ""}, {order.city}, {order.state} - {order.pincode}
              </p>
            </div>
            <div className="grid w-full gap-2 sm:w-64">
              <div className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Fulfilment</span>
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">{labelStatus(order.status)}</span>
              </div>
              <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Change status
                <select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value)} className="min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm font-normal normal-case tracking-normal text-gray-800 bg-white">
                  {["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"].map((status) => <option value={status} key={status}>{labelStatus(status)}</option>)}
                </select>
              </label>
              <div className="flex items-center justify-between gap-2 rounded-xl bg-amber-50 px-3 py-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Payment</span>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">{labelStatus(order.payment_status)}</span>
              </div>
              <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Change payment
                <select value={order.payment_status} onChange={(event) => updatePaymentStatus(order.id, event.target.value)} className="min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm font-normal normal-case tracking-normal text-gray-800 bg-white">
                  {["pending", "paid", "failed", "refunded"].map((status) => <option value={status} key={status}>{labelStatus(status)}</option>)}
                </select>
              </label>
            </div>
          </div>
          <div className="mt-3 divide-y divide-gray-100">{order.order_items.map((item) => <p key={item.id} className="py-2 text-sm text-gray-700 flex justify-between gap-3"><span>{item.product_name} × {item.quantity}</span><strong>₹{formatPrice(item.line_total)}</strong></p>)}</div>
          <div className="mt-3 grid gap-3 border-t border-gray-100 pt-3 text-sm sm:flex sm:items-center sm:justify-between">
            <span>{new Date(order.created_at).toLocaleString("en-IN")}</span>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <a href={getWhatsAppUrl(order)} target="_blank" rel="noopener noreferrer" className="rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white">WhatsApp customer</a>
              {WHATSAPP_NUMBER && <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700">Store WhatsApp</a>}
              <strong className="text-gray-900">₹{formatPrice(order.total_amount)}</strong>
            </div>
          </div>
        </article>)}
        {!orders.length && <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">No orders recorded yet.</div>}
      </div>
    </AdminCard>
  );
}

function AnalyticsSection({ orders, analyticsEvents, pendingOrders, manualRevenue, createdOrderEvents, activeProducts }: { orders: StoreOrder[]; analyticsEvents: AnalyticsEvent[]; pendingOrders: number; manualRevenue: number; createdOrderEvents: number; activeProducts: number }) {
  const deliveredOrders = orders.filter((order) => order.status === "delivered").length;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
      <Metric title="Open orders" value={pendingOrders} tone="rose" />
      <Metric title="Recorded sales" value={`₹${formatPrice(manualRevenue)}`} tone="green" />
      <Metric title="Checkout events" value={createdOrderEvents} tone="blue" />
      <Metric title="Active products" value={activeProducts} tone="green" />
      <AdminCard className="col-span-2 lg:col-span-2">
        <h2 className="font-semibold text-gray-900">Fulfilment status</h2>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gray-50 p-4"><p className="text-sm text-gray-500">Delivered</p><strong className="text-2xl text-gray-900">{deliveredOrders}</strong></div>
          <div className="rounded-xl bg-gray-50 p-4"><p className="text-sm text-gray-500">Recent orders</p><strong className="text-2xl text-gray-900">{orders.length}</strong></div>
        </div>
      </AdminCard>
      <AdminCard className="col-span-2 lg:col-span-2">
        <h2 className="font-semibold text-gray-900">Recent analytics events</h2>
        <div className="mt-4 divide-y divide-gray-100">
          {analyticsEvents.slice(0, 8).map((event) => <p key={event.id} className="grid gap-1 py-2 text-sm text-gray-700 sm:flex sm:justify-between sm:gap-3"><span>{event.event_name}</span><span className="text-xs text-gray-500 sm:text-sm">{new Date(event.created_at).toLocaleString("en-IN")}</span></p>)}
          {!analyticsEvents.length && <p className="text-sm text-gray-500">No analytics events yet.</p>}
        </div>
      </AdminCard>
    </div>
  );
}
