"use client";

import { ReactNode } from "react";

interface EmptyStateProps {
  message?: string;
  children?: ReactNode;
  className?: string;
}

export function EmptyState({
  message = "No items found.",
  children,
  className,
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className ?? ""}`}>
      <p className="text-muted-foreground">{message}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
