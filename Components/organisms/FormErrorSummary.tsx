"use client";

import { AlertCircle } from "lucide-react";

/**
 * Generic shape that matches both `react-hook-form` `FieldErrors`
 * (each leaf has a `message`) and the flat `{ field: "msg" }` map
 * produced by our `useZodForm` adapter.
 */
type AnyErrors = Record<string, unknown>;

interface FormErrorSummaryProps {
  errors: AnyErrors | undefined | null;
  className?: string;
  /** Hide entirely when no errors are present. Defaults to true. */
  hideWhenEmpty?: boolean;
  /** Override the heading copy. */
  title?: string;
}

interface FlatError {
  field: string;
  message: string;
}

/** Translate a snake_case / camelCase key into a nice label for users. */
function humanizeField(key: string): string {
  if (key === "_root") return "Form";
  const spaced = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Walk both nested `FieldErrors` trees and flat error maps. */
function flatten(errors: AnyErrors, prefix = ""): FlatError[] {
  const out: FlatError[] = [];
  for (const [key, value] of Object.entries(errors)) {
    if (!value) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      out.push({ field: path, message: value });
      continue;
    }
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      const msg = obj.message;
      if (typeof msg === "string" && msg.length > 0) {
        out.push({ field: path, message: msg });
        continue;
      }
      // Nested FieldErrors object (e.g. translations[0].title) — recurse.
      out.push(...flatten(obj as AnyErrors, path));
    }
  }
  return out;
}

/**
 * Renders an accessible summary of every validation error currently
 * present in the form. Drop this above the submit button — it makes
 * sure no failure is hidden (e.g. when an erroring field has scrolled
 * off-screen or the inline error is missing).
 */
export function FormErrorSummary({
  errors,
  className,
  hideWhenEmpty = true,
  title = "Please fix the highlighted fields:",
}: FormErrorSummaryProps) {
  if (!errors) {
    return hideWhenEmpty ? null : <></>;
  }
  const flat = flatten(errors as AnyErrors);
  if (flat.length === 0) {
    return hideWhenEmpty ? null : <></>;
  }
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={
        "rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 " +
        (className ?? "")
      }
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden />
        <div className="flex-1">
          <p className="font-medium">{title}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {flat.map(({ field, message }) => (
              <li key={field}>
                <span className="font-medium">{humanizeField(field)}:</span>{" "}
                {message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
