import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-indigo-600 text-white shadow hover:bg-indigo-500 disabled:opacity-50",
  outline:
    "border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50",
  ghost: "text-indigo-600 hover:text-indigo-500",
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
