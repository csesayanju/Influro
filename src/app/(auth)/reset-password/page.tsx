"use client";

import { AuthCard } from "@/components/ui/auth-card";
import { routes } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import styles from "../auth-theme.module.css";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function prepareRecoverySession() {
      try {
        const supabase = createClient();
        const code = searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setMessage(error.message);
            return;
          }
        } else {
          const hash = window.location.hash.startsWith("#")
            ? window.location.hash.slice(1)
            : "";
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              setMessage(error.message);
              return;
            }
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname + window.location.search
            );
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setMessage(
            "No active recovery session found. Please open this page using the reset link from your email."
          );
          return;
        }
        setReady(true);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not validate recovery session."
        );
      }
    }
    void prepareRecoverySession();
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
      setMessage("Password updated successfully. Redirecting to login...");
      setTimeout(() => {
        router.replace(routes.login);
        router.refresh();
      }, 1200);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not update password. Please try again."
      );
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
        <h1 className={styles.title}>Set new password</h1>
        <p className={styles.subtitle}>Enter your new password to finish account recovery.</p>
      </div>

      {message ? (
        <p className={styles.messageInfo}>{message}</p>
      ) : null}

      <form onSubmit={(e) => void onSubmit(e)} className="mt-6">
        <div className={styles.fieldGroup}>
          <label htmlFor="password" className={styles.label}>
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            disabled={!ready || loading}
            className={styles.input}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="confirmPassword" className={styles.label}>
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            disabled={!ready || loading}
            className={styles.input}
          />
        </div>
        <button type="submit" disabled={!ready || loading} className={styles.primaryButton}>
          {loading ? "Updating..." : "Update password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-gray-500">Loading</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
