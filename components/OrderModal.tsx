"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { isTamilNaduCity, TAMIL_NADU_CITIES } from "@/lib/tamilNaduCities";

type CartItem = { id: string; name: string; price: number; quantity: number; };

export default function OrderModal({ cart, totalAmount, onClose, onClearCart, onRemoveItem }: { cart: Record<string, CartItem>; totalAmount: number; onClose: () => void; onClearCart: () => void; onRemoveItem: (productId: string) => void; }) {
  const [details, setDetails] = useState({ name: "", phone: "", address: "", city: "", pincode: "" });
  const [attempted, setAttempted] = useState(false);
  useEffect(() => { const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose(); document.body.style.overflow = "hidden"; window.addEventListener("keydown", onKey); return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); }; }, [onClose]);
  const items = Object.values(cart);
  const cityIsValid = isTamilNaduCity(details.city);
  const isValid = details.name.trim() && /^\d{10}$/.test(details.phone.replace(/\D/g, "")) && details.address.trim() && cityIsValid && /^\d{6}$/.test(details.pincode);
  const message = encodeURIComponent(`Hello, I would like to place an order:\n\n${items.map((item) => `${item.name} × ${item.quantity} = ₹${item.price * item.quantity}`).join("\n")}\n\nTotal: ₹${totalAmount}\n\nDelivery details:\n${details.name}\n${details.phone}\n${details.address}\n${details.city} - ${details.pincode}`);
  const placeOrder = () => { setAttempted(true); if (!isValid) return; window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank", "noopener,noreferrer"); };
  const updateDetail = (field: keyof typeof details, value: string) => setDetails((current) => ({ ...current, [field]: value }));
  return <div className="overlay modal-shell" onClick={onClose}><section className="order-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Your order">
    <header className="modal-header"><div><p className="eyebrow">Almost there</p><h2>Your order</h2></div><button className="icon-button" onClick={onClose} aria-label="Close order"><X size={19} /></button></header>
    <div className="order-items">{items.map((item) => <div className="order-item" key={item.id}><div><p>{item.name}</p><small>₹{item.price} × {item.quantity}</small></div><div><strong>₹{item.price * item.quantity}</strong> <button className="remove-button" onClick={() => onRemoveItem(item.id)}>Remove</button></div></div>)}</div>
    <div className="order-total"><span>Total</span><strong>₹{totalAmount}</strong></div>
    <div className="delivery-section">
      <div className="delivery-heading"><div><p className="eyebrow">Delivery details</p><h3>Where should we deliver?</h3></div><span>Required</span></div>
      <div className="delivery-grid">
        <label className="delivery-field"><span>Full name</span><input value={details.name} onChange={(event) => updateDetail("name", event.target.value)} placeholder="Your name" autoComplete="name" className={attempted && !details.name.trim() ? "invalid" : ""} /></label>
        <label className="delivery-field"><span>Phone number</span><input value={details.phone} onChange={(event) => updateDetail("phone", event.target.value)} placeholder="10-digit number" inputMode="tel" autoComplete="tel" className={attempted && !/^\d{10}$/.test(details.phone.replace(/\D/g, "")) ? "invalid" : ""} /></label>
        <label className="delivery-field full"><span>Full address</span><textarea value={details.address} onChange={(event) => updateDetail("address", event.target.value)} placeholder="House, street and locality" autoComplete="street-address" className={attempted && !details.address.trim() ? "invalid" : ""} /></label>
        <label className="delivery-field"><span>City or town</span><input value={details.city} onChange={(event) => updateDetail("city", event.target.value)} placeholder="Start typing a Tamil Nadu city" autoComplete="address-level2" list="tamil-nadu-cities" className={attempted && !cityIsValid ? "invalid" : ""} /><datalist id="tamil-nadu-cities">{TAMIL_NADU_CITIES.map((city) => <option value={city} key={city} />)}</datalist>{details.city && !cityIsValid && <small className="field-hint">Select a supported city from the suggestions.</small>}</label>
        <label className="delivery-field"><span>PIN code</span><input value={details.pincode} onChange={(event) => updateDetail("pincode", event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit PIN" inputMode="numeric" autoComplete="postal-code" className={attempted && !/^\d{6}$/.test(details.pincode) ? "invalid" : ""} /></label>
      </div>
      {attempted && !isValid && <p className="delivery-error">Please complete all delivery details correctly.</p>}
    </div>
    <div className="modal-actions"><button className="button-primary" onClick={placeOrder}>Order on WhatsApp</button><button className="button-secondary" onClick={onClearCart}>Clear</button></div>
  </section></div>;
}
