import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--influro-cyan)] text-[var(--influro-bg)] hover:opacity-90 disabled:opacity-50",
  outline:
    "border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] text-[var(--influro-text-sub)] hover:bg-[rgba(255,255,255,0.1)] disabled:opacity-50",
  ghost:
    "text-[var(--influro-cyan)] hover:text-[var(--influro-text)] disabled:opacity-50",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
