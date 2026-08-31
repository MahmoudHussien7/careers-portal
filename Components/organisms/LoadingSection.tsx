"use client";

import { Spinner, SpinnerSize } from "@/Components/atoms/Spinner";
import { cn } from "@/lib/utils";

interface LoadingSectionProps {
  size?: SpinnerSize;
  className?: string;
}

/**
 * Centered spinner block used inside list pages and modals while data loads.
 */
export function LoadingSection({
  size = "lg",
  className,
}: LoadingSectionProps) {
  return (
    <div
      className={cn("flex items-center justify-center py-12", className)}
      aria-busy
    >
      <Spinner size={size} />
    </div>
  );
}
