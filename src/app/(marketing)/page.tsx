import { routes } from "@/config/routes";
import Link from "next/link";
import styles from "./home-theme.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoPill}>
          <span className={styles.logoDot} />
          <span className={styles.logoText}>INFLURO</span>
        </div>
        <h1 className={styles.title}>Track influencer ROI with confidence</h1>
        <p className={styles.subtitle}>
          Unified dashboard for campaign performance, attribution, and fraud-aware
          decisions for modern D2C teams.
        </p>
        <nav className={styles.nav}>
          <Link href={routes.login} className={styles.linkPrimary}>
            Log in
          </Link>
          <Link href={routes.signup} className={styles.linkPrimary}>
            Sign up
          </Link>
          <Link href={routes.dashboard} className={styles.linkSecondary}>
            Dashboard
          </Link>
        </nav>
      </div>
    </main>
  );
}
