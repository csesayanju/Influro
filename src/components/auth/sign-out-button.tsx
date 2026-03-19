"use client";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className="font-medium"
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push(routes.login);
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
