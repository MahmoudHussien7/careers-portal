"use client";

import { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  children,
  ...rest
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "block text-sm font-medium text-card-foreground mb-1",
        className,
      )}
      {...rest}
    >
      {children}
    </label>
  );
}
