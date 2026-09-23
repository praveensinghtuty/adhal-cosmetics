"use client";

import type { User } from "@supabase/supabase-js";
import { CheckCircle2, MapPin, Package, Phone, ReceiptText, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/sales";
import { supabase } from "@/lib/supabaseClient";

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  image_url: string | null;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal: number;
  courier_amount: number | null;
  total_amount: number;
  customer_name: string;
  customer_phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  created_at: string;
  order_items: OrderItem[];
};

const statusLabel = (value: string) =>
  value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");

export default function OrdersPage() {
  const router = useRouter();
  const [orderJustPlaced] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("placed") === "1";
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async (user: User) => {
      const { data } = await supabase
        .from("orders")
        .select("id,order_number,status,payment_status,subtotal,courier_amount,total_amount,customer_name,customer_phone,address_line1,address_line2,city,state,pincode,created_at,order_items(id,product_name,quantity,unit_price,line_total,image_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders((data as Order[]) || []);
      setLoading(false);
    };

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/account/login");
        return;
      }
      loadOrders(data.user);
    });
  }, [router]);

  return (
    <main className="account-page">
      <div className="site-shell">
        <p className="eyebrow">Orders</p>
        <h1 className="section-title">Your order history.</h1>
        {orderJustPlaced && <div className="order-success-notice">
          <CheckCircle2 size={18} />
          <div>
            <strong>Order placed</strong>
            <p>We will confirm availability, courier charges, and final payable amount on WhatsApp.</p>
          </div>
        </div>}
        <div className="orders-list">
          {loading && <div className="empty-state">Loading orders...</div>}
          {!loading && !orders.length && <div className="empty-state">No orders yet. Your placed orders will appear here.</div>}
          {orders.map((order) => {
            const createdAt = new Date(order.created_at);
            const itemCount = order.order_items.reduce((sum, item) => sum + item.quantity, 0);

            return (
              <article className="order-history-card" key={order.id}>
                <header className="order-history-head">
                  <div>
                    <span className="order-history-label">Order placed</span>
                    <strong>{order.order_number}</strong>
                    <time>{createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</time>
                  </div>
                  <div className="order-history-summary">
                    <span className={`status-badge status-${order.status}`}>{statusLabel(order.status)}</span>
                    <b>₹{formatPrice(order.total_amount)}</b>
                    <small>{itemCount} {itemCount === 1 ? "item" : "items"}</small>
                  </div>
                </header>

                <div className="order-history-meta">
                  <div><ReceiptText size={15} /><span>Payment</span><strong>{statusLabel(order.payment_status)}</strong></div>
                  <div><Phone size={15} /><span>Contact</span><strong>{order.customer_phone}</strong></div>
                  <div><MapPin size={15} /><span>Deliver to</span><strong>{order.city}, {order.pincode}</strong></div>
                  <div><Truck size={15} /><span>Courier</span><strong>{order.courier_amount === null ? "To be confirmed" : `₹${formatPrice(order.courier_amount)}`}</strong></div>
                </div>

                <div className="order-history-items">
                  {order.order_items.map((item) => (
                    <div className="order-history-item" key={item.id}>
                      <div className="order-item-thumb">
                        {item.image_url ? <img src={item.image_url} alt={item.product_name} /> : <Package size={18} />}
                      </div>
                      <div>
                        <strong>{item.product_name}</strong>
                        <span>Qty {item.quantity} × ₹{formatPrice(item.unit_price)}</span>
                      </div>
                      <b>₹{formatPrice(item.line_total)}</b>
                    </div>
                  ))}
                </div>

                <footer className="order-history-footer">
                  <div>
                    <span>Delivery address</span>
                    <p>{order.customer_name}, {order.address_line1}{order.address_line2 ? `, ${order.address_line2}` : ""}, {order.city}, {order.state} - {order.pincode}</p>
                  </div>
                  <div>
                    <span>Amount details</span>
                    <p>Products ₹{formatPrice(order.subtotal)} · Courier {order.courier_amount === null ? "to be confirmed" : `₹${formatPrice(order.courier_amount)}`} · Total ₹{formatPrice(order.total_amount)}</p>
                  </div>
                  <button onClick={() => router.push("/products")}>Shop again</button>
                </footer>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
