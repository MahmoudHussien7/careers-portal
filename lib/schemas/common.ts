import { z } from "zod";

/**
 * Reusable Zod 4 primitives for the CMS forms.
 *
 * Goal: every field across the CMS shares the same building blocks so QA
 * can write predictable test cases ("does this match the `slug` rule?"
 * "does this match the `phone` rule?") and end users see consistent,
 * actionable error messages.
 *
 * Conventions:
 *   1. Every helper takes a `label` so messages start with the field
 *      name (e.g. "Email is required.").
 *   2. We avoid `z.preprocess()` / `.transform()` on string fields so
 *      TypeScript stays happy inside `z.object({...})` — the input and
 *      output types are both `string | undefined`.
 *   3. For coerced numeric fields we use `z.preprocess(...)` to map empty
 *      strings to `undefined` so a blank input doesn't become `0`.
 *
 * Zod 4 API note: the old `required_error` / `invalid_type_error` keys
 * were removed. We rely on `.min(1, message)` for required-ness and
 * `.refine(...)` for format.
 */

/* ----------------------------------------------------------------- *
 *  Regex catalog
 * ----------------------------------------------------------------- */

const UUID_RX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const SLUG_RX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PHONE_RX = /^\+?[0-9\s\-()]{7,20}$/;
const URL_RX = /^https?:\/\/[^\s<>"]+$/i;
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_RX =
  /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;
const INT_RX = /^-?\d+$/;
const NUMBER_RX = /^-?\d+(\.\d+)?$/;

/* ----------------------------------------------------------------- *
 *  Required text fields
 * ----------------------------------------------------------------- */

export const requiredString = (
  label: string,
  opts: { min?: number; max?: number; describe?: string } = {},
) => {
  const { min = 1, max = 255, describe } = opts;
  return z
    .string({ message: `${label} must be text.` })
    .trim()
    .min(min, {
      message:
        min === 1
          ? `${label} is required.`
          : `${label} must be at least ${min} characters${describe ? ` (${describe})` : ""}.`,
    })
    .max(max, {
      message: `${label} must be at most ${max} characters${describe ? ` (${describe})` : ""}.`,
    });
};

/**
 * Optional text. Returns a schema whose value type is plain `string`
 * (empty string acts as "no value"). We don't use `.optional()` because
 * mixing it with `.refine()` chains breaks Zod 4's type inference inside
 * `z.object({...})` (the field collapses to `{}` in `z.infer`).
 *
 * Consumer pages already translate `"" → undefined` before building the
 * API payload (`data.field || undefined`).
 */
export const optionalString = (label: string, max = 255) =>
  z
    .string()
    .max(max, { message: `${label} must be at most ${max} characters.` });

/* ----------------------------------------------------------------- *
 *  Identifiers
 * ----------------------------------------------------------------- */

/**
 * UUID. With `required: false` (default true when omitted), empty
 * string is accepted in place of "no value".
 */
export const uuid = (label: string, { required = true } = {}) => {
  if (required) {
    return z
      .string()
      .min(1, { message: `${label} is required.` })
      .refine((v) => UUID_RX.test(v), {
        message: `${label} must be a valid identifier (UUID like 9c1f0a3e-…).`,
      });
  }
  return z
    .string()
    .refine((v) => !v || UUID_RX.test(v), {
      message: `${label} must be a valid identifier (UUID like 9c1f0a3e-…).`,
    });
};

export const slug = (label = "Slug") =>
  z
    .string()
    .trim()
    .min(2, { message: `${label} must be at least 2 characters.` })
    .max(80, { message: `${label} must be at most 80 characters.` })
    .regex(SLUG_RX, {
      message: `${label} can only contain lowercase letters, numbers and single hyphens (e.g. "my-job-post"). No spaces, underscores, capitals or special characters.`,
    });

export const optionalSlug = (label = "Slug") =>
  z
    .string()
    .refine((v) => !v || (v.length >= 2 && v.length <= 80 && SLUG_RX.test(v)), {
      message: `${label} can only contain lowercase letters, numbers and single hyphens, 2–80 characters.`,
    });

/* ----------------------------------------------------------------- *
 *  Email / phone / password
 * ----------------------------------------------------------------- */

export const email = (label = "Email") =>
  z
    .string()
    .trim()
    .min(1, { message: `${label} is required.` })
    .max(254, { message: `${label} is too long (max 254 characters).` })
    .refine((v) => EMAIL_RX.test(v), {
      message: `${label} must look like a valid address, e.g. "name@example.com".`,
    });

export const optionalEmail = (label = "Email") =>
  z
    .string()
    .refine((v) => !v || (v.length <= 254 && EMAIL_RX.test(v)), {
      message: `${label} must look like a valid address, e.g. "name@example.com".`,
    });

export const phone = (label = "Phone", { required = false } = {}) => {
  if (required) {
    return z
      .string()
      .min(1, { message: `${label} is required.` })
      .max(20, { message: `${label} is too long (max 20 characters).` })
      .refine((v) => PHONE_RX.test(v), {
        message: `${label} must contain 7–15 digits and may start with +. Example: "+971501234567".`,
      });
  }
  return z
    .string()
    .refine((v) => !v || (v.length <= 20 && PHONE_RX.test(v)), {
      message: `${label} must contain 7–15 digits and may start with +. Example: "+971501234567".`,
    });
};

export const password = (label = "Password") =>
  z
    .string()
    .min(8, { message: `${label} must be at least 8 characters.` })
    .max(72, { message: `${label} must be at most 72 characters.` })
    .refine((v) => /[A-Za-z]/.test(v), {
      message: `${label} must contain at least one letter.`,
    })
    .refine((v) => /[0-9]/.test(v), {
      message: `${label} must contain at least one digit.`,
    });

/* ----------------------------------------------------------------- *
 *  URLs
 * ----------------------------------------------------------------- */

export const url = (label = "URL") =>
  z
    .string()
    .min(1, { message: `${label} is required.` })
    .max(2048, { message: `${label} is too long (max 2048 characters).` })
    .refine((v) => URL_RX.test(v), {
      message: `${label} must be a valid URL starting with http:// or https://.`,
    });

export const optionalUrl = (label = "URL") =>
  z
    .string()
    .refine((v) => !v || (v.length <= 2048 && URL_RX.test(v)), {
      message: `${label} must be a valid URL starting with http:// or https://.`,
    });

/* ----------------------------------------------------------------- *
 *  Numbers (coerced)
 *
 *  We use `.nullable().optional()` so a missing form input maps to
 *  `null | undefined`. The output type is `number | null | undefined`
 *  which all consumer pages already handle via `?? undefined` before
 *  the payload is built.
 *
 *  KNOWN LIMITATION: HTML number inputs deliver `""` for an empty field.
 *  Because `z.coerce.number()` parses `""` as `0`, a blank field arrives
 *  as `0` here. Pages should treat the value as "missing" when it's
 *  exactly `0` AND the field is logically optional. We document this in
 *  `docs/FORM_VALIDATION.md`.
 * ----------------------------------------------------------------- */

/* --- Numeric helpers --- *
 * Zod 4 has a quirk where `z.coerce.number().optional().nullable()`
 * collapses to `{}` in `z.infer`. We cast to a hand-written schema type
 * to keep the inferred field type as `number | null | undefined`.
 */

type OptionalNumberSchema = z.ZodOptional<z.ZodNullable<z.ZodNumber>>;

export const optionalNonNegativeInt = (
  label: string,
): OptionalNumberSchema =>
  z.coerce
    .number({ message: `${label} must be a whole number.` })
    .int({ message: `${label} must be a whole number (no decimals).` })
    .min(0, { message: `${label} cannot be negative.` })
    .nullable()
    .optional() as unknown as OptionalNumberSchema;

export const optionalPositiveNumber = (
  label: string,
  { max }: { max?: number } = {},
): OptionalNumberSchema =>
  z.coerce
    .number({ message: `${label} must be a number.` })
    .min(0, { message: `${label} cannot be negative.` })
    .max(max ?? Number.MAX_SAFE_INTEGER, {
      message: max
        ? `${label} must be at most ${max}.`
        : `${label} is too large.`,
    })
    .nullable()
    .optional() as unknown as OptionalNumberSchema;

export const optionalLatitude = (
  label = "Latitude",
): OptionalNumberSchema =>
  z.coerce
    .number({ message: `${label} must be a number.` })
    .min(-90, { message: `${label} must be between -90 and 90.` })
    .max(90, { message: `${label} must be between -90 and 90.` })
    .nullable()
    .optional() as unknown as OptionalNumberSchema;

export const optionalLongitude = (
  label = "Longitude",
): OptionalNumberSchema =>
  z.coerce
    .number({ message: `${label} must be a number.` })
    .min(-180, { message: `${label} must be between -180 and 180.` })
    .max(180, { message: `${label} must be between -180 and 180.` })
    .nullable()
    .optional() as unknown as OptionalNumberSchema;

/* ----------------------------------------------------------------- *
 *  Numbers kept as strings (for forms that prefer to coerce manually)
 * ----------------------------------------------------------------- */

export const optionalIntString = (
  label: string,
  { min = 0, max }: { min?: number; max?: number } = {},
) =>
  z
    .string()
    .refine((v) => !v || INT_RX.test(v), {
      message: `${label} must be a whole number (no decimals).`,
    })
    .refine((v) => !v || Number(v) >= min, {
      message:
        min === 0
          ? `${label} cannot be negative.`
          : `${label} must be at least ${min}.`,
    })
    .refine((v) => !v || max === undefined || Number(v) <= max, {
      message: max ? `${label} must be at most ${max}.` : `${label} is too large.`,
    });

export const optionalNumberString = (
  label: string,
  { min = 0, max }: { min?: number; max?: number } = {},
) =>
  z
    .string()
    .refine((v) => !v || NUMBER_RX.test(v), {
      message: `${label} must be a number (digits and at most one decimal point).`,
    })
    .refine((v) => !v || Number(v) >= min, {
      message:
        min === 0
          ? `${label} cannot be negative.`
          : `${label} must be at least ${min}.`,
    })
    .refine((v) => !v || max === undefined || Number(v) <= max, {
      message: max ? `${label} must be at most ${max}.` : `${label} is too large.`,
    });

export const optionalLatitudeString = (label = "Latitude") =>
  optionalNumberString(label, { min: -90, max: 90 });

export const optionalLongitudeString = (label = "Longitude") =>
  optionalNumberString(label, { min: -180, max: 180 });

/* ----------------------------------------------------------------- *
 *  Dates
 * ----------------------------------------------------------------- */

export const optionalDate = (label: string) =>
  z
    .string()
    .refine((v) => !v || DATE_RX.test(v), {
      message: `${label} must be in YYYY-MM-DD format (e.g. "2026-04-27").`,
    });

export const optionalDateTime = (label: string) =>
  z
    .string()
    .refine((v) => !v || DATETIME_RX.test(v), {
      message: `${label} must be a valid date/time (e.g. "2026-04-27T15:30").`,
    });

/* ----------------------------------------------------------------- *
 *  JSON
 * ----------------------------------------------------------------- */

export const optionalJsonString = (label = "JSON") =>
  z
    .string()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        try {
          JSON.parse(val);
          return true;
        } catch {
          return false;
        }
      },
      {
        message: `${label} must be valid JSON. Check for missing quotes, trailing commas, or unescaped characters.`,
      },
    );

/* ----------------------------------------------------------------- *
 *  Booleans / enums
 * ----------------------------------------------------------------- */

export const bool = (label: string) =>
  z.boolean({ message: `${label} must be true or false.` });

export const optionalBool = () => z.boolean().optional();

export const enumField = <T extends readonly [string, ...string[]]>(
  label: string,
  values: T,
  { required = true } = {},
) => {
  const validValues = new Set<string>(values);
  if (required) {
    return z
      .string()
      .min(1, { message: `${label} is required.` })
      .refine((v) => validValues.has(v), {
        message: `${label} must be one of: ${values.join(", ")}.`,
      });
  }
  return z
    .string()
    .refine((v) => !v || validValues.has(v), {
      message: `${label} must be one of: ${values.join(", ")}.`,
    });
};

/* ----------------------------------------------------------------- *
 *  CSV helpers (used for "tags" inputs)
 * ----------------------------------------------------------------- */

export const optionalCsv = (
  label: string,
  { maxItems = 50, itemMax = 60 }: { maxItems?: number; itemMax?: number } = {},
) =>
  z
    .string()
    .refine(
      (v) => {
        if (!v) return true;
        const items = v.split(",").map((s) => s.trim()).filter(Boolean);
        return items.length <= maxItems;
      },
      {
        message: `${label} can contain at most ${maxItems} comma-separated values.`,
      },
    )
    .refine(
      (v) => {
        if (!v) return true;
        const items = v.split(",").map((s) => s.trim()).filter(Boolean);
        return items.every((item) => item.length <= itemMax);
      },
      {
        message: `Each value in ${label} must be ${itemMax} characters or fewer.`,
      },
    );

/* ----------------------------------------------------------------- *
 *  Zod error → field map
 * ----------------------------------------------------------------- */

/**
 * Flatten a Zod error into a flat `{ [path]: firstMessage }` map.
 * Nested fields are joined by dots (e.g. "translations.0.name").
 */
export function zodErrorToFieldMap(
  error: z.ZodError,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_root";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
