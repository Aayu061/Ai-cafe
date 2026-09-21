import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  children: React.ReactNode;
}

export function Card({
  className,
  hoverEffect = true,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-offwhite rounded-3xl border border-espresso/5 p-6 shadow-soft transition-all duration-300",
        hoverEffect && "hover:shadow-card hover:-translate-y-1 hover:border-espresso/15",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
