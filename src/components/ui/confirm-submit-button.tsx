"use client";

import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

type ConfirmSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmMessage: string;
};

export function ConfirmSubmitButton({
  confirmMessage,
  className,
  onClick,
  ...props
}: ConfirmSubmitButtonProps) {
  return (
    <button
      {...props}
      className={cn(className)}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
    />
  );
}
