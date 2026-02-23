"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error" | "primary";
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  default: "bg-surface text-text-secondary",
  success: "bg-green-light text-green",
  warning: "bg-amber-light text-amber",
  error: "bg-red-light text-red",
  primary: "bg-primary-lightest text-primary",
};

export function Badge({
  variant = "default",
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
