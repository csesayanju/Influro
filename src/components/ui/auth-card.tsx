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
        "mx-auto w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
