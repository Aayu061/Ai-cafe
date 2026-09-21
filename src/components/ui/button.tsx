import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-caramel disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

    const variantStyles = {
      primary:
        "bg-espresso text-cream hover:bg-espresso-light shadow-soft hover:shadow-card border border-espresso/10",
      secondary:
        "bg-sage text-offwhite hover:bg-sage-dark shadow-soft hover:shadow-card",
      accent:
        "bg-caramel text-espresso font-semibold hover:bg-caramel-light shadow-soft hover:shadow-card",
      outline:
        "border border-sage/30 text-sage hover:bg-sage/5 hover:border-sage",
      ghost:
        "text-espresso hover:bg-espresso/5",
    };

    const sizeStyles = {
      sm: "text-xs px-4 py-1.5 gap-1.5",
      md: "text-sm px-6 py-2.5 gap-2",
      lg: "text-base px-8 py-3.5 gap-2.5",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
