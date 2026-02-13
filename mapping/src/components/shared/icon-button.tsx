"use client";

import { ButtonHTMLAttributes } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export function IconButton({
  label,
  children,
  className = "",
  disabled,
  ...props
}: IconButtonProps) {
  return (
    <button
      title={label}
      aria-label={label}
      disabled={disabled}
      className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
        ${
          disabled
            ? "cursor-not-allowed opacity-40"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }
        ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
