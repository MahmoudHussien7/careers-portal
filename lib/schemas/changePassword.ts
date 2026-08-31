import { z } from "zod";
import type { PasswordPolicy } from "@/types/auth";

const SPECIAL_CHAR_RX = /[^A-Za-z0-9]/;

function passwordFromPolicy(label: string, policy: PasswordPolicy) {
  return z
    .string()
    .min(1, { message: `${label} is required.` })
    .min(policy.minLength, {
      message: `${label} must be at least ${policy.minLength} characters.`,
    })
    .max(policy.maxLength, {
      message: `${label} must be at most ${policy.maxLength} characters.`,
    })
    .superRefine((value, ctx) => {
      if (policy.requireUppercase && !/[A-Z]/.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} must contain at least one uppercase letter.`,
        });
      }
      if (policy.requireLowercase && !/[a-z]/.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} must contain at least one lowercase letter.`,
        });
      }
      if (policy.requireNumber && !/[0-9]/.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} must contain at least one number.`,
        });
      }
      if (policy.requireSpecialCharacter && !SPECIAL_CHAR_RX.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} must contain at least one special character.`,
        });
      }
    });
}

export function makeChangePasswordSchema(policy: PasswordPolicy) {
  return z
    .object({
      currentPassword: z
        .string()
        .min(1, { message: "Current password is required." }),
      newPassword: passwordFromPolicy("New password", policy),
      confirmNewPassword: z
        .string()
        .min(1, { message: "Please confirm your new password." }),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: "New password and confirmation must match.",
      path: ["confirmNewPassword"],
    })
    .refine((data) => data.newPassword !== data.currentPassword, {
      message: "New password must be different from your current password.",
      path: ["newPassword"],
    });
}

export function passwordPolicyRules(policy: PasswordPolicy): string[] {
  if (policy.rules?.length) return policy.rules;

  const rules = [
    `At least ${policy.minLength} characters`,
    `At most ${policy.maxLength} characters`,
  ];
  if (policy.requireUppercase) {
    rules.push("At least one uppercase letter (A–Z)");
  }
  if (policy.requireLowercase) {
    rules.push("At least one lowercase letter (a–z)");
  }
  if (policy.requireNumber) {
    rules.push("At least one number (0–9)");
  }
  if (policy.requireSpecialCharacter) {
    rules.push("At least one special character");
  }
  return rules;
}

export type ChangePasswordFormData = z.infer<
  ReturnType<typeof makeChangePasswordSchema>
>;
