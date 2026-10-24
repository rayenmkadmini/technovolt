import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  children,
}: {
  className?: string;
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const variants = {
    default: "bg-[#0B69FF] text-white",
    secondary: "bg-[#F5A623] text-slate-900 font-bold",
    outline: "border border-slate-300 text-slate-700 bg-white",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold",
    warning: "bg-amber-50 text-amber-700 border border-amber-200 font-semibold",
    danger: "bg-red-50 text-red-700 border border-red-200 font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs tracking-wide transition-colors",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
