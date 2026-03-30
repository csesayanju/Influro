"use client";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { useRouter } from "next/navigation";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className={cn("font-medium", className)}
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
