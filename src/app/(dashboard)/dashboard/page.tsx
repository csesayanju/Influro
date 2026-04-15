import { DeleteAccountButton } from "@/features/auth/components/delete-account-button";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { ensureBrandProfile } from "@/features/brands/actions";
import { getBrandByUserId } from "@/features/brands/queries";
import { routes } from "@/config/routes";
import { createServerClient } from "@/lib/supabase";
import Link from "next/link";
import { redirect } from "next/navigation";
import styles from "./dashboard-theme.module.css";

export default async function DashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(routes.login);

  const ensured = await ensureBrandProfile();
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

  const { data: brand } = await getBrandByUserId(user.id);
  if (brand && !brand.category) redirect(routes.onboarding);

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.text}>
          Signed in as <span className={styles.textStrong}>{user.email}</span>
        </p>
        {brand ? (
          <p className={styles.text}>
            Brand: <span className={styles.textStrong}>{brand.name}</span>
            {brand.plan ? <span> · Plan: {brand.plan}</span> : null}
          </p>
        ) : null}
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
