"use client";

import { AuthCard } from "@/components/ui/auth-card";
import { routes } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";
import styles from "../auth-theme.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}${routes.resetPassword}`,
      });

      if (error) {
        const lower = error.message.toLowerCase();
        if (lower.includes("rate limit")) {
          setMessage(
            "Too many reset emails requested. Please wait a few minutes and try again."
          );
        } else {
          setMessage(error.message);
        }
        setLoading(false);
        return;
      }

      setMessage(
        "Password reset link sent. Check your inbox and open the link on this device."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not send reset email. Please try again."
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
        <h1 className={styles.title}>Reset password</h1>
        <p className={styles.subtitle}>We&apos;ll send a secure reset link to your email.</p>
        <p className={styles.hint}>If you don&apos;t see it, check spam/promotions and wait a minute.</p>
      </div>

      {message ? (
        <p className={styles.messageInfo}>{message}</p>
      ) : null}

      <form onSubmit={(e) => void onSubmit(e)} className="mt-6">
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
        <button type="submit" disabled={loading} className={styles.primaryButton}>
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className={styles.footerText}>
        <Link href={routes.login} className={styles.link}>
          Back to login
        </Link>
      </p>
    </AuthCard>
  );
}
