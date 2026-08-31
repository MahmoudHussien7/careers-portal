"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "primary" | "neutral" | "success" | "danger";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  primary: "bg-muted-background text-gi-primary",
  neutral: "bg-muted-background text-card-foreground",
  success: "bg-green-100 text-green-800",
  danger: "bg-red-100 text-red-800",
};

export function Badge({ children, tone = "primary", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
