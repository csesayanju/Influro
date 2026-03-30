"use client";

import { AuthCard } from "@/components/ui/auth-card";
import { routes } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import styles from "../auth-theme.module.css";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? routes.dashboard;
  const authError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(
    authError ? "Sign-in failed. Check your email and password." : null
  );
  const [loading, setLoading] = useState(false);

  function normalizeLoginError(raw: string) {
    const lower = raw.toLowerCase();
    if (lower.includes("failed to fetch") || lower.includes("network")) {
      return "Could not reach Supabase. Check your internet and NEXT_PUBLIC_SUPABASE_* env values, then retry.";
    }
    if (lower.includes("invalid api key") || lower.includes("apikey")) {
      return "Supabase key looks invalid. Verify NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.";
    }
    return raw;
  }

  async function onEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    let errorMessage: string | null = null;
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        errorMessage = normalizeLoginError(error.message);
      }
    } catch (error) {
      errorMessage =
        error instanceof Error
          ? normalizeLoginError(error.message)
          : "Could not sign in. Please try again.";
    }
    setLoading(false);
    if (errorMessage) {
      setMessage(errorMessage);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <AuthCard>
      <div className="text-center">
        <div className={styles.logoPill}>
          <span className={styles.logoDot} />
          <span className={styles.logoText}>INFLURO</span>
        </div>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to your brand dashboard</p>
      </div>
      <p className={styles.footerText}>
        New here?{" "}
        <Link href={routes.signup} className={styles.link}>
          Create an account
        </Link>
      </p>

      {message ? (
        <p className={styles.messageError}>{message}</p>
      ) : null}

      <form onSubmit={(e) => void onEmailLogin(e)} className="mt-6">
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
        </div>
        <p className={styles.helperRight}>
          <Link href={routes.forgotPassword} className={styles.link}>
            Forgot password?
          </Link>
        </p>
        <button type="submit" disabled={loading} className={styles.primaryButton}>
          {loading ? "..." : "Log in"}
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-gray-500">Loading</div>}>
      <LoginForm />
    </Suspense>
  );
}
