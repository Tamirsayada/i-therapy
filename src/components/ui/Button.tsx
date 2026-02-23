"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl font-medium transition-colors cursor-pointer",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" &&
          "bg-primary text-white hover:bg-primary-dark shadow-sm",
        variant === "secondary" &&
          "bg-primary-lightest text-primary hover:bg-primary-lighter",
        variant === "ghost" &&
          "bg-transparent text-text-secondary hover:bg-surface",
        size === "sm" && "px-4 py-2 text-sm",
        size === "md" && "px-6 py-3 text-base",
        size === "lg" && "px-8 py-4 text-lg",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
