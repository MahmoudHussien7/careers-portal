"use client";

import { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

const baseClasses =
  "w-full px-3 py-2 border border-border-color rounded-md text-foreground bg-card-background focus:outline-none focus:ring-gi-primary focus:border-gi-primary";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={cn(baseClasses, className)} {...rest}>
        {children}
      </select>
    );
  },
);
