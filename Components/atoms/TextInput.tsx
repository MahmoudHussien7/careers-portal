"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

const baseClasses =
  "w-full px-3 py-2 border border-border-color rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-gi-primary focus:border-gi-primary";

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ className, type = "text", ...rest }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(baseClasses, className)}
        {...rest}
      />
    );
  },
);
