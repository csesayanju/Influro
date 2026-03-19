import { cn } from "@/lib/utils/cn";
import type { InputHTMLAttributes } from "react";

const inputClass =
  "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export type FieldProps = {
  label: string;
  id: string;
  className?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function Field({ label, id, className, ...inputProps }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input id={id} className={cn(inputClass)} {...inputProps} />
    </div>
  );
}
