"use client";

import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { routes } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

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

  async function onEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <AuthCard>
      <h1 className="text-2xl font-semibold text-gray-900">Log in</h1>
      <p className="mt-1 text-sm text-gray-600">
        New here?{" "}
        <Link
          href={routes.signup}
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Create an account
        </Link>
      </p>

      {message ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {message}
        </p>
      ) : null}

      <form onSubmit={(e) => void onEmailLogin(e)} className="mt-6 space-y-4">
        <Field
          label="Email"
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Password"
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "..." : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href={routes.home} className="hover:text-gray-700">
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
