import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "sage" | "caramel" | "cream" | "espresso";
  size?: "sm" | "md";
  children: React.ReactNode;
}

export function Badge({
  className,
  variant = "sage",
  size = "sm",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center font-medium tracking-wide uppercase rounded-full transition-colors";

  const variantStyles = {
    sage: "bg-sage/10 text-sage border border-sage/20",
    caramel: "bg-caramel/15 text-caramel-dark border border-caramel/30",
    cream: "bg-cream-dark/60 text-espresso border border-espresso/10",
    espresso: "bg-espresso text-cream border border-espresso/20",
  };

  const sizeStyles = {
    sm: "text-[10px] px-2.5 py-0.5 tracking-wider",
    md: "text-xs px-3 py-1 tracking-normal",
  };

  return (
    <span
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {children}
    </span>
  );
}
