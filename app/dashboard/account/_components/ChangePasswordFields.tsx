"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import * as dal from "@/lib/dal";
import { tokenStore } from "@/lib/token";
import { extractApiError } from "@/lib/utils";
import {
  makeChangePasswordSchema,
  type ChangePasswordFormData,
} from "@/lib/schemas/changePassword";
import type { PasswordPolicy } from "@/types/auth";
import { Button } from "@/Components/atoms/Button";
import { PasswordInput } from "@/Components/atoms/PasswordInput";
import { FieldError, errorRingClass } from "@/Components/atoms/FieldError";
import { FormErrorSummary } from "@/Components/organisms/FormErrorSummary";
import { ErrorBanner } from "@/Components/organisms/ErrorBanner";

interface Props {
  policy: PasswordPolicy;
  policyRules: string[];
}

export function ChangePasswordFields({ policy, policyRules }: Props) {
  const schema = useMemo(() => makeChangePasswordSchema(policy), [policy]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setSuccessMessage(null);

    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) {
      setSubmitError("Your session has expired. Please sign in again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await dal.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmNewPassword: values.confirmNewPassword,
        refreshToken,
      });

      if (response.data?.accessToken) {
        tokenStore.set(response.data.accessToken);
      }
      if (response.data?.refreshToken) {
        tokenStore.setRefreshToken(response.data.refreshToken);
      }

      setSuccessMessage(
        response.message ??
          "Your password has been updated. Other active sessions were signed out.",
      );
      reset();
    } catch (err) {
      setSubmitError(extractApiError(err, "Failed to change password."));
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <>
      {successMessage && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-medium text-green-800">
              {successMessage}
            </p>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-green-700 hover:text-green-900"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <ErrorBanner
        message={submitError}
        onDismiss={() => setSubmitError(null)}
      />

      {policyRules.length > 0 && (
        <div className="mb-5 rounded-md border border-border-color bg-muted-background/50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <ShieldCheck className="h-4 w-4 text-gi-primary" />
            Password requirements
          </div>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {policyRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <FormErrorSummary errors={errors} className="mb-2" />

        <div>
          <label
            htmlFor="currentPassword"
            className="mb-1 block text-sm font-medium text-card-foreground"
          >
            Current password
          </label>
          <PasswordInput
            id="currentPassword"
            autoComplete="current-password"
            className={errorRingClass(!!errors.currentPassword)}
            aria-invalid={!!errors.currentPassword}
            {...register("currentPassword")}
          />
          <FieldError message={errors.currentPassword?.message} />
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="mb-1 block text-sm font-medium text-card-foreground"
          >
            New password
          </label>
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            className={errorRingClass(!!errors.newPassword)}
            aria-invalid={!!errors.newPassword}
            {...register("newPassword")}
          />
          <FieldError message={errors.newPassword?.message} />
        </div>

        <div>
          <label
            htmlFor="confirmNewPassword"
            className="mb-1 block text-sm font-medium text-card-foreground"
          >
            Confirm new password
          </label>
          <PasswordInput
            id="confirmNewPassword"
            autoComplete="new-password"
            className={errorRingClass(!!errors.confirmNewPassword)}
            aria-invalid={!!errors.confirmNewPassword}
            {...register("confirmNewPassword")}
          />
          <FieldError message={errors.confirmNewPassword?.message} />
        </div>

        <Button type="submit" disabled={isSubmitting} fullWidth>
          {isSubmitting ? "Updating password…" : "Update password"}
        </Button>
      </form>
    </>
  );
}
