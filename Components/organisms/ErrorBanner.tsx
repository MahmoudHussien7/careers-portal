"use client";

import { cn } from "@/lib/utils";

interface ErrorBannerProps {
  message: string | null | undefined;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Red banner used to surface API errors at the top of pages.
 */
export function ErrorBanner({
  message,
  onDismiss,
  className,
}: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div className={cn("mb-4 rounded-md bg-red-50 p-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium text-red-800">{message}</h3>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-700 hover:text-red-900"
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
