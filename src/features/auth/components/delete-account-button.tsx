"use client";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteAccountButton({ className }: { className?: string }) {
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

    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.replace(routes.signup);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="outline"
        className={cn(
          "border-red-400/40 bg-red-500/10 text-red-200 hover:bg-red-500/20",
          className
        )}
        disabled={loading}
        onClick={() => void onDeleteAccount()}
      >
        {loading ? "Deleting..." : "Delete account"}
      </Button>
      {message ? <p className="text-sm text-red-300">{message}</p> : null}
    </div>
  );
}
