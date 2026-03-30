import { routes } from "@/config/routes";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(routes.login);
  }

  const { data: brand } = await supabase
    .from("brands")
    .select("category")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!brand) {
    redirect(routes.dashboard);
  }

  return <>{children}</>;
}
