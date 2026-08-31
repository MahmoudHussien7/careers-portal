import type { HrApplication } from "@/types/careers";

/**
 * Display name for a candidate row.
 * Prefers "First Last", falls back to email, then to a stable label.
 */
export function candidateFullName(
  application: HrApplication | null | undefined,
): string {
  if (!application) return "Candidate";
  const composed = [application.first_name, application.last_name]
    .filter((part) => typeof part === "string" && part.trim().length > 0)
    .join(" ")
    .trim();
  if (composed) return composed;
  if (application.email) return application.email;
  return "Candidate";
}

/** Two-character avatar initials, e.g. "Mahmoud Hussein" → "MH". */
export function candidateInitials(
  application: HrApplication | null | undefined,
): string {
  const name = candidateFullName(application);
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Try to resolve `cv_url` to something the browser can actually open.
 *
 * The backend currently ships `cv_url` as a bare filename
 * (e.g. "Mahmoud Hussein Abdulhaliem.pdf"). If/when it starts returning
 * absolute URLs or proxy paths, this helper transparently uses them.
 */
export function resolveCvUrl(application: HrApplication | null): string | null {
  const value = application?.cv_url;
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  // Bare filename — we don't know the storage prefix yet, so let the
  // UI render the filename without an action link.
  return null;
}

/** Render a yes/no/dash for tri-state booleans. */
export function formatBool(value: boolean | null | undefined): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "—";
}

/** Render a date-only string (`YYYY-MM-DD`) from an ISO timestamp. */
export function formatDateOnly(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}
