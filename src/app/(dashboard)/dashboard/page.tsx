import { DeleteAccountButton } from "@/components/auth/delete-account-button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { routes } from "@/config/routes";
import { ensureBrandProfile } from "@/lib/actions/brands";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import styles from "./dashboard-theme.module.css";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(routes.login);
  }

  const ensured = await ensureBrandProfile();
  if ("error" in ensured) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <p className={styles.dangerText}>
          Could not set up brand profile: {ensured.error}
          </p>
          <div className={styles.actions}>
            <SignOutButton className="border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] text-slate-300 hover:bg-[rgba(255,255,255,0.12)]" />
          </div>
        </div>
      </main>
    );
  }

  const { data: brand } = await supabase
    .from("brands")
    .select("name, plan, category")
    .eq("user_id", user.id)
    .maybeSingle();

  if (brand && !brand.category) {
    redirect(routes.onboarding);
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.text}>
          Signed in as{" "}
          <span className={styles.textStrong}>{user.email}</span>
        </p>
        {brand ? (
          <p className={styles.text}>
            Brand:{" "}
            <span className={styles.textStrong}>{brand.name}</span>
            {brand.plan ? (
              <span> · Plan: {brand.plan}</span>
            ) : null}
          </p>
        ) : null}
        <div className={styles.actions}>
          <SignOutButton className="border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] text-slate-300 hover:bg-[rgba(255,255,255,0.12)]" />
          <Link
            href={routes.onboarding}
            className={styles.linkBtn}
          >
            Edit brand profile
          </Link>
          <Link
            href={routes.home}
            className={styles.linkBtn}
          >
            Home
          </Link>
        </div>
        <div className={styles.danger}>
          <p className={styles.dangerTitle}>Danger zone</p>
          <p className={styles.dangerText}>
            Deleting your account is permanent and removes related records.
          </p>
          <DeleteAccountButton />
        </div>
      </div>
    </main>
  );
}
