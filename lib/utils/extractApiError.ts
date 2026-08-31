/**
 * Pulls a human-readable error message out of an axios/fetch failure shape
 * matching what the dashboard pages used to do inline.
 */
export function extractApiError(
  error: unknown,
  fallback: string = "Something went wrong",
): string {
  if (!error) return fallback;

  const e = error as {
    response?: { data?: { message?: string; error?: string } };
    message?: string;
  };

  return (
    e.response?.data?.message ??
    e.response?.data?.error ??
    e.message ??
    fallback
  );
}
