import { cn } from "@/lib/utils/cn";
import type { InputHTMLAttributes } from "react";

const inputClass =
  "mt-1 block w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-[var(--influro-text)] placeholder:text-[var(--influro-text-muted)] focus:border-[var(--influro-cyan)] focus:outline-none focus:ring-1 focus:ring-[var(--influro-cyan)]";

export type FieldProps = {
  label: string;
  id: string;
  className?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function Field({ label, id, className, ...inputProps }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--influro-text-sub)]">
        {label}
      </label>
      <input id={id} className={cn(inputClass)} {...inputProps} />
    </div>
  );
}
