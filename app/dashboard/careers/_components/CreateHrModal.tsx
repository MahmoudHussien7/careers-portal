"use client";

import { useMemo } from "react";
import { Button } from "@/Components/atoms/Button";
import { FieldError, errorRingClass } from "@/Components/atoms/FieldError";
import { FormErrorSummary } from "@/Components/organisms/FormErrorSummary";
import type { HrDirectoryUser, HrRoleSlug } from "@/types/careers";
import {
  HR_ROLE_OPTIONS,
  HrFormState,
  eligibleManagers,
  isManagerRequired,
} from "./careersForms";

interface CreateHrModalProps {
  open: boolean;
  saving: boolean;
  form: HrFormState;
  errors: Partial<Record<keyof HrFormState, string>>;
  setField: <K extends keyof HrFormState>(key: K, value: HrFormState[K]) => void;
  hrUsers: HrDirectoryUser[];
  onClose: () => void;
  onSubmit: () => void;
}

export function CreateHrModal({
  open,
  saving,
  form,
  errors,
  setField,
  hrUsers,
  onClose,
  onSubmit,
}: CreateHrModalProps) {
  const managers = useMemo(
    () => eligibleManagers(form.role_slug, hrUsers),
    [form.role_slug, hrUsers],
  );

  const managerRequired = isManagerRequired(form.role_slug);

  if (!open) return null;

  const handleRoleChange = (value: string) => {
    setField("role_slug", value as HrRoleSlug | "");
    // Clear the manager whenever the role changes — the eligible
    // pool changes and the previous selection may no longer be valid.
    setField("manager_id", "");
  };

  const managerHint =
    managers.length === 0 && form.role_slug
      ? form.role_slug === "hr-admin"
        ? "HR Admin sits at the top of the hierarchy."
        : "No eligible manager exists yet — create one first."
      : managerRequired
        ? "Required: must be a Senior Recruiter."
        : "Optional.";

  return (
    <div className="fixed inset-0 z-50 bg-gi-gray bg-opacity-50 p-4">
      <div className="mx-auto mt-20 w-full max-w-2xl rounded-md border bg-card-background p-5 shadow">
        <h3 className="mb-1 text-lg font-semibold text-foreground">
          Create HR User
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Hierarchy: HR Admin → Senior Recruiter → Recruiter. Office Admin
          reports to HR Admin.
        </p>

        <FormErrorSummary errors={errors} className="mb-4" />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-card-foreground">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="name@gi.com"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              className={errorRingClass(!!errors.email)}
              aria-invalid={!!errors.email}
            />
            <FieldError message={errors.email} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-card-foreground">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              placeholder="8+ chars, 1 letter + 1 digit"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              className={errorRingClass(!!errors.password)}
              aria-invalid={!!errors.password}
            />
            <FieldError message={errors.password} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-card-foreground">
              First name <span className="text-red-500">*</span>
            </label>
            <input
              placeholder="First name"
              value={form.first_name}
              onChange={(e) => setField("first_name", e.target.value)}
              className={errorRingClass(!!errors.first_name)}
              aria-invalid={!!errors.first_name}
            />
            <FieldError message={errors.first_name} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-card-foreground">
              Last name <span className="text-red-500">*</span>
            </label>
            <input
              placeholder="Last name"
              value={form.last_name}
              onChange={(e) => setField("last_name", e.target.value)}
              className={errorRingClass(!!errors.last_name)}
              aria-invalid={!!errors.last_name}
            />
            <FieldError message={errors.last_name} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-card-foreground">
              Phone
            </label>
            <input
              placeholder="+971501234567"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              className={errorRingClass(!!errors.phone)}
              aria-invalid={!!errors.phone}
            />
            <FieldError message={errors.phone} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-card-foreground">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={form.role_slug}
              onChange={(e) => handleRoleChange(e.target.value)}
              className={errorRingClass(!!errors.role_slug)}
              aria-invalid={!!errors.role_slug}
            >
              <option value="">Select a role</option>
              {HR_ROLE_OPTIONS.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError message={errors.role_slug} />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-card-foreground">
              Manager{" "}
              {managerRequired && <span className="text-red-500">*</span>}
            </label>
            <select
              value={form.manager_id}
              onChange={(e) => setField("manager_id", e.target.value)}
              disabled={!form.role_slug || managers.length === 0}
              className={`${errorRingClass(!!errors.manager_id)} disabled:bg-muted-background`}
              aria-invalid={!!errors.manager_id}
            >
              <option value="">
                {managerRequired
                  ? "Select a Senior Recruiter"
                  : "No manager"}
              </option>
              {managers.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.first_name} {person.last_name} ·{" "}
                  {person.role_name || person.role_slug}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">{managerHint}</p>
            <FieldError message={errors.manager_id} />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "Saving..." : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}
