import type { ReactNode } from "react";
import styles from "./auth-theme.module.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className={styles.layout}>{children}</div>;
}
