import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

export function AuthCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-md rounded-3xl border p-8 backdrop-blur-2xl",
        "[font-family:var(--influro-font-family)]",
        "border-[var(--influro-card-border)] bg-[var(--influro-card-bg)] text-[var(--influro-text)]",
        "shadow-[0_8px_64px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]",
        className
      )}
    >
      {children}
    </div>
  );
}
