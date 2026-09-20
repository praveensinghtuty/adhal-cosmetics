"use client";

import type { User } from "@supabase/supabase-js";
import { CheckCircle2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/sales";
import { supabase } from "@/lib/supabaseClient";
import { isTamilNaduCity, TAMIL_NADU_CITIES } from "@/lib/tamilNaduCities";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
};

type Address = {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};

const emptyDetails = { name: "", phone: "", address: "", address2: "", city: "", pincode: "" };

export default function OrderModal({
  cart,
  totalAmount,
  onClose,
  onClearCart,
  onRemoveItem,
}: {
  cart: Record<string, CartItem>;
  totalAmount: number;
  onClose: () => void;
  onClearCart: () => void;
  onRemoveItem: (productId: string) => void;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [details, setDetails] = useState(emptyDetails);
  const [attempted, setAttempted] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (!data.user) return;
      const { data: savedAddresses } = await supabase
        .from("customer_addresses")
        .select("id,label,full_name,phone,address_line1,address_line2,city,state,pincode,is_default")
        .eq("user_id", data.user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      const nextAddresses = savedAddresses || [];
      setAddresses(nextAddresses);
      const defaultAddress = nextAddresses.find((address) => address.is_default) || nextAddresses[0];
      if (defaultAddress) {
        setSelectedAddress(defaultAddress.id);
        setDetails({
          name: defaultAddress.full_name,
          phone: defaultAddress.phone,
          address: defaultAddress.address_line1,
          address2: defaultAddress.address_line2 || "",
          city: defaultAddress.city,
          pincode: defaultAddress.pincode,
        });
      }
    });

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const items = Object.values(cart);
  const cityIsValid = isTamilNaduCity(details.city);
  const phoneIsValid = /^\d{10}$/.test(details.phone.replace(/\D/g, ""));
  const isValid = Boolean(details.name.trim() && phoneIsValid && details.address.trim() && cityIsValid && /^\d{6}$/.test(details.pincode));

  function applyAddress(address: Address) {
    setSelectedAddress(address.id);
    setDetails({
      name: address.full_name,
      phone: address.phone,
      address: address.address_line1,
      address2: address.address_line2 || "",
      city: address.city,
      pincode: address.pincode,
    });
  }

  const updateDetail = (field: keyof typeof details, value: string) => {
    setSelectedAddress("");
    setDetails((current) => ({ ...current, [field]: value }));
  };

  const goToLogin = () => {
    onClose();
    router.push("/account/login");
  };

  const placeOrder = async () => {
    setAttempted(true);
    setMessage(null);
    if (!user) {
      setMessage("Sign in to place and track your order.");
      return;
    }
    if (!isValid || placing || !items.length) return;

    setPlacing(true);
    const normalizedPhone = details.phone.replace(/\D/g, "");
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        customer_name: details.name.trim(),
        customer_phone: normalizedPhone,
        address_line1: details.address.trim(),
        address_line2: details.address2.trim() || null,
        city: details.city.trim(),
        state: "Tamil Nadu",
        pincode: details.pincode,
        subtotal: totalAmount,
        total_amount: totalAmount,
        status: "pending",
        payment_status: "pending",
        payment_method: "manual",
      })
      .select("id,order_number")
      .single();

    if (orderError || !order) {
      setMessage(orderError?.message || "Could not place order.");
      setPlacing(false);
      return;
    }

    const { error: itemsError } = await supabase.from("order_items").insert(items.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      unit_price: item.price,
      quantity: item.quantity,
      line_total: item.price * item.quantity,
      image_url: item.image_url || null,
    })));

    if (itemsError) {
      setMessage(itemsError.message);
      setPlacing(false);
      return;
    }

    await supabase.from("analytics_events").insert({
      user_id: user.id,
      event_name: "order_created",
      properties: { order_id: order.id, order_number: order.order_number, total_amount: totalAmount, item_count: items.length },
      page_path: window.location.pathname,
    });

    onClearCart();
    router.push("/account/orders");
  };

  return (
    <div className="overlay modal-shell" onClick={onClose}>
      <section className="order-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Your order">
        <header className="modal-header"><div><p className="eyebrow">Almost there</p><h2>Your order</h2></div><button className="icon-button" onClick={onClose} aria-label="Close order"><X size={19} /></button></header>
        <div className="order-items">{items.map((item) => <div className="order-item" key={item.id}><div><p>{item.name}</p><small>₹{formatPrice(item.price)} × {item.quantity}</small></div><div><strong>₹{formatPrice(item.price * item.quantity)}</strong> <button className="remove-button" onClick={() => onRemoveItem(item.id)}>Remove</button></div></div>)}</div>
        <div className="order-total"><span>Total</span><strong>₹{formatPrice(totalAmount)}</strong></div>
        {!user && <div className="checkout-login-callout"><CheckCircle2 size={18} /><div><strong>Sign in before checkout</strong><p>Orders are now saved to your account so you can track them later.</p></div><button onClick={goToLogin}>Sign in</button></div>}
        <div className="delivery-section">
          <div className="delivery-heading"><div><p className="eyebrow">Delivery details</p><h3>Where should we deliver?</h3></div><span>Required</span></div>
          {addresses.length > 0 && <label className="delivery-field full"><span>Saved address</span><select value={selectedAddress} onChange={(event) => { const address = addresses.find((item) => item.id === event.target.value); if (address) applyAddress(address); else { setSelectedAddress(""); setDetails(emptyDetails); } }}><option value="">Enter a new address</option>{addresses.map((address) => <option value={address.id} key={address.id}>{address.label} - {address.city}</option>)}</select></label>}
          <div className="delivery-grid">
            <label className="delivery-field"><span>Full name</span><input value={details.name} onChange={(event) => updateDetail("name", event.target.value)} placeholder="Your name" autoComplete="name" className={attempted && !details.name.trim() ? "invalid" : ""} /></label>
            <label className="delivery-field"><span>Phone number</span><input value={details.phone} onChange={(event) => updateDetail("phone", event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" inputMode="tel" autoComplete="tel" className={attempted && !phoneIsValid ? "invalid" : ""} /></label>
            <label className="delivery-field full"><span>Full address</span><textarea value={details.address} onChange={(event) => updateDetail("address", event.target.value)} placeholder="House, street and locality" autoComplete="street-address" className={attempted && !details.address.trim() ? "invalid" : ""} /></label>
            <label className="delivery-field"><span>Landmark or area</span><input value={details.address2} onChange={(event) => updateDetail("address2", event.target.value)} placeholder="Optional" /></label>
            <label className="delivery-field"><span>City or town</span><input value={details.city} onChange={(event) => updateDetail("city", event.target.value)} placeholder="Start typing a Tamil Nadu city" autoComplete="address-level2" list="tamil-nadu-cities" className={attempted && !cityIsValid ? "invalid" : ""} /><datalist id="tamil-nadu-cities">{TAMIL_NADU_CITIES.map((city) => <option value={city} key={city} />)}</datalist>{details.city && !cityIsValid && <small className="field-hint">Select a supported city from the suggestions.</small>}</label>
            <label className="delivery-field"><span>PIN code</span><input value={details.pincode} onChange={(event) => updateDetail("pincode", event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit PIN" inputMode="numeric" autoComplete="postal-code" className={attempted && !/^\d{6}$/.test(details.pincode) ? "invalid" : ""} /></label>
          </div>
          {attempted && !isValid && <p className="delivery-error">Please complete all delivery details correctly.</p>}
          {message && <p className="delivery-error">{message}</p>}
        </div>
        <div className="modal-actions"><button className="button-primary" onClick={placeOrder} disabled={placing}>{placing ? "Placing order..." : "Place order"}</button><button className="button-secondary" onClick={onClearCart}>Clear</button></div>
      </section>
    </div>
  );
}
