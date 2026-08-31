"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ZodTypeAny, z } from "zod";
import { zodErrorToFieldMap } from "@/lib/schemas/common";

/**
 * Lightweight adapter that brings react-hook-form-style validation UX to
 * plain-`useState` forms.
 *
 * Why this exists: half of the CMS uses react-hook-form (edit pages),
 * the other half uses `useState` (modals in careers, developers, …).
 * Rather than convert every modal to RHF (large refactor), we wrap the
 * existing `useState` setters with a tiny helper that:
 *
 *   • Validates the whole form on `submit()`.
 *   • Returns a flat `{ [field]: message }` map of errors.
 *   • Clears a field's error the moment the user edits it.
 *   • Optionally validates on blur via `register(field).onBlur`.
 *
 * The signature mirrors what RHF gives us — `register`, `errors`,
 * `handleSubmit`, `reset` — so component markup looks the same.
 */

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export interface UseZodFormOptions<TSchema extends ZodTypeAny> {
  schema: TSchema;
  /** Validate on every change. Default: only validate on submit + blur. */
  validateOnChange?: boolean;
}

type AnyRecord = Record<string, unknown>;

export function useZodForm<
  TSchema extends ZodTypeAny,
  TValues extends AnyRecord = z.input<TSchema> & AnyRecord,
>(initial: TValues, { schema, validateOnChange = false }: UseZodFormOptions<TSchema>) {
  const [values, setValues] = useState<TValues>(initial);
  const [errors, setErrors] = useState<FieldErrors<TValues>>({});
  /** True after first submit attempt — controls whether errors render. */
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const submittedRef = useRef(false);

  const runValidation = useCallback(
    (next: TValues): { ok: true; data: z.output<TSchema> } | { ok: false; errors: FieldErrors<TValues> } => {
      const result = schema.safeParse(next);
      if (result.success) return { ok: true, data: result.data };
      const map = zodErrorToFieldMap(result.error);
      return { ok: false, errors: map as FieldErrors<TValues> };
    },
    [schema],
  );

  const setField = useCallback(
    <K extends keyof TValues>(key: K, value: TValues[K]) => {
      setValues((prev) => {
        const next = { ...prev, [key]: value };
        if (validateOnChange || submittedRef.current) {
          const result = runValidation(next);
          setErrors(result.ok ? {} : result.errors);
        } else {
          // Clear just this field's error so the inline message disappears
          // as the user types.
          setErrors((prevErrors) => {
            if (!prevErrors[key]) return prevErrors;
            const rest = { ...prevErrors };
            delete rest[key];
            return rest as FieldErrors<TValues>;
          });
        }
        return next;
      });
    },
    [runValidation, validateOnChange],
  );

  /** Bulk-replace the form values (used by `openEdit` flows). */
  const replaceValues = useCallback((next: TValues) => {
    setValues(next);
    setErrors({});
    submittedRef.current = false;
    setSubmitAttempted(false);
  }, []);

  const reset = useCallback(
    (next?: TValues) => {
      submittedRef.current = false;
      setSubmitAttempted(false);
      setErrors({});
      if (next) setValues(next);
      else setValues(initial);
    },
    [initial],
  );

  /**
   * Validate the form, return parsed/typed data on success or set errors
   * and return null on failure. Designed to be called from a submit
   * handler:
   *
   *   const data = handleSubmit();
   *   if (!data) return;
   *   await dal.create(data);
   */
  const handleSubmit = useCallback((): z.output<TSchema> | null => {
    submittedRef.current = true;
    setSubmitAttempted(true);
    const result = runValidation(values);
    if (result.ok) {
      setErrors({});
      return result.data;
    }
    setErrors(result.errors);
    return null;
  }, [runValidation, values]);

  /** Synchronous validity check (used to disable Save when nothing changed). */
  const isValid = useMemo(() => {
    const result = schema.safeParse(values);
    return result.success;
  }, [schema, values]);

  /**
   * Mini-RHF style register: returns props for an input.
   *
   *   <input {...register("email")} />
   */
  const register = useCallback(
    <K extends keyof TValues>(key: K) => ({
      name: key as string,
      value: (values[key] ?? "") as TValues[K],
      onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
      ) => {
        const target = event.target as HTMLInputElement;
        const raw =
          target.type === "checkbox"
            ? (target.checked as unknown as TValues[K])
            : (target.value as unknown as TValues[K]);
        setField(key, raw);
      },
      onBlur: () => {
        const result = runValidation(values);
        if (!result.ok) {
          const message = result.errors[key];
          if (message) {
            setErrors((prev) => ({ ...prev, [key]: message }));
          }
        }
      },
    }),
    [runValidation, setField, values],
  );

  return {
    values,
    setValues: replaceValues,
    setField,
    errors,
    isValid,
    submitAttempted,
    register,
    handleSubmit,
    reset,
  };
}

export type UseZodFormReturn<
  TSchema extends ZodTypeAny,
  TValues extends AnyRecord = z.input<TSchema> & AnyRecord,
> = ReturnType<typeof useZodForm<TSchema, TValues>>;
