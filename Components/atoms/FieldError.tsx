"use client";

import { cn } from "@/lib/utils";

/**
 * Inline form-field error message.
 *
 * Renders nothing when `message` is empty so callers can drop it next
 * to every input without conditional logic. Uses `role="alert"` so
 * screen readers announce the error the moment it appears.
 *
 * @example
 *   <input
 *     {...register("email")}
 *     aria-invalid={!!errors.email}
 *     className={errorRingClass(!!errors.email)}
 *   />
 *   <FieldError message={errors.email?.message} />
 */
export function FieldError({
  message,
  className,
}: {
  message?: string | null;
  className?: string;
}) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className={cn("mt-1 text-xs font-medium text-red-600", className)}
    >
      {message}
    </p>
  );
}

/**
 * Adds a red ring + border to an input when it has a validation error.
 * Pair with `<FieldError />` to give the user an unmistakable visual
 * cue plus a human-readable explanation.
 */
export function errorRingClass(
  hasError?: boolean,
  base = "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2",
): string {
  return hasError
    ? `${base} border-red-400 focus:ring-red-200 bg-red-50/30`
    : `${base} border-border-color focus:ring-gi-primary/40`;
}
