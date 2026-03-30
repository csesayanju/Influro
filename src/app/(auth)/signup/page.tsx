"use client";

import { AuthCard } from "@/components/ui/auth-card";
import { routes } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../auth-theme.module.css";

export default function SignupPage() {
  const router = useRouter();
  const [brandName, setBrandName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function normalizeSignupError(raw: string) {
    const lower = raw.toLowerCase();
    if (lower.includes("email rate limit exceeded")) {
      return "Too many signup emails were requested. Please wait a few minutes, then try again, or log in if the account already exists.";
    }
    if (lower.includes("failed to fetch") || lower.includes("network")) {
      return "Could not reach Supabase. Check your internet and NEXT_PUBLIC_SUPABASE_* env values, then retry.";
    }
    return raw;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}${routes.authCallback}`,
          data: {
            full_name: brandName.trim() || undefined,
          },
        },
      });
      if (error) {
        setMessage(normalizeSignupError(error.message));
        setLoading(false);
        return;
      }
      if (data.user?.identities?.length === 0) {
        setMessage("This email is already registered. Try logging in.");
        setLoading(false);
        return;
      }
      setMessage(
        "Check your email for a confirmation link (if required), or you may already be signed in."
      );
      router.refresh();
      if (data.session) {
        router.push(routes.dashboard);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? normalizeSignupError(error.message)
          : "Could not sign up. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard>
      <div className="text-center">
        <div className={styles.logoPill}>
          <span className={styles.logoDot} />
          <span className={styles.logoText}>INFLURO</span>
        </div>
        <h1 className={styles.title}>Start tracking ROI</h1>
        <p className={styles.subtitle}>Create your account in 30 seconds</p>
      </div>
      <p className={styles.footerText}>
        Already have an account?{" "}
        <Link href={routes.login} className={styles.link}>
          Log in
        </Link>
      </p>

      {message ? (
        <p className={styles.messageInfo}>{message}</p>
      ) : null}

      <form onSubmit={(e) => void onSubmit(e)} className="mt-6">
        <div className={styles.fieldGroup}>
          <label htmlFor="brandName" className={styles.label}>
            Brand name (optional)
          </label>
          <input
            id="brandName"
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="e.g. Mamaearth"
            className={styles.input}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="password" className={styles.label}>
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
        </div>
        <button type="submit" disabled={loading} className={styles.primaryButton}>
          {loading ? "..." : "Create account"}
        </button>
      </form>

      <p className={styles.footerText}>
        <Link href={routes.home} className={styles.link}>
          Back to home
        </Link>
      </p>
    </AuthCard>
  );
}
