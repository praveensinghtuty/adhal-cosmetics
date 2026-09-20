"use client";

import type { User } from "@supabase/supabase-js";
import { MapPin, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isTamilNaduCity, TAMIL_NADU_CITIES } from "@/lib/tamilNaduCities";
import { supabase } from "@/lib/supabaseClient";

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

const emptyForm = {
  label: "Home",
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "Tamil Nadu",
  pincode: "",
};

export default function AddressesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  const fetchAddresses = async (userId: string) => {
    const { data } = await supabase
      .from("customer_addresses")
      .select("id,label,full_name,phone,address_line1,address_line2,city,state,pincode,is_default")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    setAddresses(data || []);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (!data.user) router.replace("/account/login");
      else fetchAddresses(data.user.id);
    });
  }, [router]);

  const updateForm = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const addAddress = async () => {
    if (!user) return;
    setMessage(null);
    const normalizedPhone = form.phone.replace(/\D/g, "");
    const cityValid = isTamilNaduCity(form.city);
    if (!form.full_name.trim() || normalizedPhone.length !== 10 || !form.address_line1.trim() || !cityValid || !/^\d{6}$/.test(form.pincode)) {
      setMessage("Complete the address with a valid Tamil Nadu city, 10-digit phone, and 6-digit PIN.");
      return;
    }

    const shouldBeDefault = addresses.length === 0;
    const { error } = await supabase.from("customer_addresses").insert({
      user_id: user.id,
      ...form,
      phone: normalizedPhone,
      is_default: shouldBeDefault,
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setForm(emptyForm);
    await fetchAddresses(user.id);
    setMessage("Address saved.");
  };

  const makeDefault = async (addressId: string) => {
    if (!user) return;
    await supabase.from("customer_addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("customer_addresses").update({ is_default: true }).eq("id", addressId).eq("user_id", user.id);
    await fetchAddresses(user.id);
  };

  const removeAddress = async (addressId: string) => {
    if (!user) return;
    await supabase.from("customer_addresses").delete().eq("id", addressId).eq("user_id", user.id);
    await fetchAddresses(user.id);
  };

  return (
    <main className="account-page">
      <div className="site-shell account-two-column">
        <section>
          <p className="eyebrow">Address book</p>
          <h1 className="section-title">Saved delivery addresses.</h1>
          <p className="section-copy">Keep your common delivery locations ready for checkout.</p>
          <div className="address-list">
            {addresses.map((address) => <article className="address-card" key={address.id}>
              <div><strong>{address.label}</strong>{address.is_default && <span>Default</span>}</div>
              <p>{address.full_name}<br />{address.address_line1}{address.address_line2 ? `, ${address.address_line2}` : ""}<br />{address.city}, {address.state} - {address.pincode}<br />{address.phone}</p>
              <div className="address-actions">
                <button onClick={() => makeDefault(address.id)}><Star size={14} /> Set default</button>
                <button onClick={() => removeAddress(address.id)}><Trash2 size={14} /> Remove</button>
              </div>
            </article>)}
            {!addresses.length && <div className="empty-state">No saved addresses yet.</div>}
          </div>
        </section>

        <section className="account-panel">
          <h2>Add address</h2>
          <label className="account-field"><span>Label</span><input value={form.label} onChange={(event) => updateForm("label", event.target.value)} /></label>
          <label className="account-field"><span>Full name</span><input value={form.full_name} onChange={(event) => updateForm("full_name", event.target.value)} autoComplete="name" /></label>
          <label className="account-field"><span>Phone</span><input value={form.phone} onChange={(event) => updateForm("phone", event.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="tel" /></label>
          <label className="account-field"><span>Address line 1</span><input value={form.address_line1} onChange={(event) => updateForm("address_line1", event.target.value)} autoComplete="street-address" /></label>
          <label className="account-field"><span>Address line 2</span><input value={form.address_line2} onChange={(event) => updateForm("address_line2", event.target.value)} /></label>
          <label className="account-field"><span>City or town</span><input value={form.city} onChange={(event) => updateForm("city", event.target.value)} list="address-cities" /><datalist id="address-cities">{TAMIL_NADU_CITIES.map((city) => <option value={city} key={city} />)}</datalist></label>
          <label className="account-field"><span>PIN code</span><input value={form.pincode} onChange={(event) => updateForm("pincode", event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" /></label>
          <button className="button-primary account-button" onClick={addAddress}><MapPin size={16} /> Save address</button>
          {message && <p className="account-message">{message}</p>}
        </section>
      </div>
    </main>
  );
}
