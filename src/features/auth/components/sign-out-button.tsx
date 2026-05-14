"use client";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { useState } from "react";

export function SignOutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      variant="outline"
      disabled={loading}
      className={cn("font-medium", className)}
      onClick={async () => {
        setLoading(true);
        const supabase = createBrowserClient();
        // `scope: "local"` clears the auth cookie immediately without a
        // round-trip to Supabase's /logout endpoint. The default ("global")
        // revokes every refresh token server-side, which adds 1–3s on a
        // slow connection and blocks the redirect. Refresh tokens expire
        // naturally on the server, so the local-scope tradeoff is fine.
        await supabase.auth.signOut({ scope: "local" });
        // Hard nav so middleware re-evaluates with no auth cookies.
        window.location.assign(routes.login);
      }}
    >
      {loading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
