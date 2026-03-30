"use client";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteAccountButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onDeleteAccount() {
    const confirmed = window.confirm(
      "Delete your account permanently? This removes your auth user and related data."
    );
    if (!confirmed) return;

    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/account/delete", { method: "POST" });
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setLoading(false);
      setMessage(payload?.error ?? "Could not delete account.");
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace(routes.signup);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="outline"
        className="border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
        disabled={loading}
        onClick={() => void onDeleteAccount()}
      >
        {loading ? "Deleting..." : "Delete account"}
      </Button>
      {message ? <p className="text-sm text-red-600">{message}</p> : null}
    </div>
  );
}
