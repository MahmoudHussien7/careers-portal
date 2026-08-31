/**
 * Shared date formatting helpers used across dashboard pages.
 * Centralised to keep behaviour consistent.
 */

export const formatDateTime = (
  value: string | Date | null | undefined,
  fallback: string = "—",
): string => {
  if (!value) return fallback;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleString();
};

export const formatDate = (
  value: string | Date | null | undefined,
  fallback: string = "—",
): string => {
  if (!value) return fallback;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString();
};

export const formatPublishedAt = (
  value: string | Date | null | undefined,
): string => formatDateTime(value, "Not published");
