"use client";

import type { User } from "@supabase/supabase-js";
import { Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (user) router.replace("/account");
  }, [router, user]);

  const sendEmailLink = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: { emailRedirectTo: `${window.location.origin}/account` },
    });
    setMessage(error ? error.message : "Check your email for the sign-in link.");
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/account` },
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  };

  return (
    <main className="account-page">
      <div className="site-shell account-auth-layout">
        <section>
          <p className="eyebrow">Your account</p>
          <h1 className="section-title">Sign in to shop faster.</h1>
          <p className="section-copy">Use Google or email to save addresses, track orders, and checkout without typing everything again.</p>
          <div className="account-benefits">
            {["Saved delivery addresses", "Order history and status", "Faster checkout before payment gateway"].map((item) => <div key={item}><ShieldCheck size={17} /> {item}</div>)}
          </div>
        </section>

        <section className="account-panel">
          <button className="auth-provider-button" onClick={signInWithGoogle} disabled={loading}>Continue with Google</button>

          <div className="auth-divider"><span>Email login</span></div>
          <label className="account-field"><span>Email address</span><div><Mail size={16} /><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" /></div></label>
          <button className="button-primary account-button" onClick={sendEmailLink} disabled={loading}>Send sign-in link</button>
          {message && <p className="account-message">{message}</p>}
        </section>
      </div>
    </main>
  );
}
