"use client";

import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { routes } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

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
      <h1 className="text-2xl font-semibold text-gray-900">Reset password</h1>
      <p className="mt-1 text-sm text-gray-600">
        We&apos;ll send a secure reset link to your email.
      </p>
      <p className="mt-1 text-xs text-gray-500">
        If you don&apos;t see it, check spam/promotions and wait a minute.
      </p>

      {message ? (
        <p className="mt-4 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
          {message}
        </p>
      ) : null}

      <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
        <Field
          label="Email"
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href={routes.login} className="hover:text-gray-700">
          Back to login
        </Link>
      </p>
    </AuthCard>
  );
}
