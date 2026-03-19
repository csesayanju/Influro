"use client";

import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { routes } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const origin = window.location.origin;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}${routes.authCallback}`,
      },
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    if (data.user?.identities?.length === 0) {
      setMessage("This email is already registered. Try logging in.");
      return;
    }
    setMessage(
      "Check your email for a confirmation link (if required), or you may already be signed in."
    );
    router.refresh();
    if (data.session) {
      router.push(routes.dashboard);
    }
  }

  return (
    <AuthCard>
      <h1 className="text-2xl font-semibold text-gray-900">Sign up</h1>
      <p className="mt-1 text-sm text-gray-600">
        Already have an account?{" "}
        <Link
          href={routes.login}
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Log in
        </Link>
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
        <Field
          label="Password"
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "..." : "Create account"}
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
