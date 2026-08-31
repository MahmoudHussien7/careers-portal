"use client";

import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

const baseClasses =
  "w-full px-3 py-2 border border-border-color rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-gi-primary focus:border-gi-primary";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, rows = 4, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(baseClasses, className)}
        {...rest}
      />
    );
  },
);
