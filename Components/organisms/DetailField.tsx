"use client";

import { ReactNode } from "react";

interface DetailFieldProps {
  label: string;
  children: ReactNode;
  /** Render the value as raw HTML (used for blog/community content). */
  asHtml?: boolean;
}

/**
 * Label + value block used inside view modals.
 */
export function DetailField({ label, children, asHtml }: DetailFieldProps) {
  return (
    <div>
      <p className="text-sm font-medium text-card-foreground">{label}</p>
      {asHtml && typeof children === "string" ? (
        <div
          className="text-sm text-foreground mt-1 prose max-w-none"
          dangerouslySetInnerHTML={{ __html: children }}
        />
      ) : (
        <p className="text-sm text-foreground mt-1">{children}</p>
      )}
    </div>
  );
}
