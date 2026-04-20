import { DeleteAccountButton } from "@/features/auth/components/delete-account-button";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { ensureBrandProfile } from "@/features/brands/actions";
import { routes } from "@/config/routes";
import { createServerClient } from "@/lib/supabase";
import Link from "next/link";
import { redirect } from "next/navigation";
import styles from "./dashboard-theme.module.css";

export default async function DashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(routes.login);

  // ensureBrandProfile(user) reuses the user we already have — no extra
  // getUser() round-trip. It also returns the brand, so no getBrandByUserId().
  const ensured = await ensureBrandProfile(user);
  if ("error" in ensured) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <p className={styles.dangerText}>Could not set up brand profile: {ensured.error}</p>
          <div className={styles.actions}>
            <SignOutButton />
          </div>
        </div>
      </main>
    );
  }

  const { brand } = ensured;
  if (!brand.category) redirect(routes.onboarding);

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.text}>
          Signed in as <span className={styles.textStrong}>{user.email}</span>
        </p>
        <p className={styles.text}>
          Brand: <span className={styles.textStrong}>{brand.name}</span>
          {brand.plan ? <span> · Plan: {brand.plan}</span> : null}
        </p>
        <div className={styles.actions}>
          <SignOutButton />
          <Link href={routes.campaigns} className={styles.linkBtn}>Manage campaigns</Link>
          <Link href={routes.onboarding} className={styles.linkBtn}>Edit brand profile</Link>
          <Link href={routes.home} className={styles.linkBtn}>Home</Link>
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
