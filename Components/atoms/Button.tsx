"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "outline";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const baseClasses =
  "inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent text-white bg-gi-primary hover:bg-gi-primary-hover focus:ring-gi-primary",
  secondary:
    "border border-border-color text-card-foreground bg-card-background hover:bg-muted-background focus:ring-gi-primary shadow-sm",
  danger:
    "border border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
  ghost:
    "border border-transparent text-card-foreground hover:bg-muted-background focus:ring-gi-primary",
  outline:
    "border border-border-color text-card-foreground hover:bg-muted-background focus:ring-gi-primary",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      fullWidth,
      className,
      type = "button",
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className,
        )}
        {...rest}
      />
    );
  },
);
