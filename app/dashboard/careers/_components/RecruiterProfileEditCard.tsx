"use client";

import { useMemo } from "react";
import { Briefcase, Mail, MapPin, Pencil, Phone, User, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui";
import { Button } from "@/Components/atoms/Button";
import { FieldError, errorRingClass } from "@/Components/atoms/FieldError";
import { FormErrorSummary } from "@/Components/organisms/FormErrorSummary";
import {
  HR_ROLE_OPTIONS,
  type HrDirectoryUser,
  type HrRoleSlug,
} from "@/types/careers";
import {
  eligibleManagers,
  isManagerRequired,
} from "./careersForms";
import { useHrUserProfileEdit } from "./useHrUserProfileEdit";

const NONE = "__none__";

interface RecruiterProfileEditCardProps {
  recruiter: HrDirectoryUser;
  hrUsers: HrDirectoryUser[];
  onSaved: () => void;
  onError: (message: string) => void;
}

export function RecruiterProfileEditCard({
  recruiter,
  hrUsers,
  onSaved,
  onError,
}: RecruiterProfileEditCardProps) {
  const edit = useHrUserProfileEdit({
    user: recruiter,
    hrUsers,
    onSaved,
    onError,
  });

  const roleSlug = (edit.values.role_slug || recruiter.role_slug) as HrRoleSlug;

  const managers = useMemo(
    () => eligibleManagers(roleSlug, hrUsers),
    [roleSlug, hrUsers],
  );

  const showManagerField =
    roleSlug === "recruiter" ||
    roleSlug === "senior-recruiter" ||
    roleSlug === "office-admin";
  const managerRequired = isManagerRequired(roleSlug);

  const managerHint = useMemo(() => {
    if (!showManagerField) return null;
    if (managers.length === 0) {
      if (roleSlug === "recruiter") {
        return "Create a Senior Recruiter first, then assign them here.";
      }
      return "No eligible manager exists in the directory yet.";
    }
    if (managerRequired) {
      return "Required — pick the Senior Recruiter this person reports to.";
    }
    return "Optional — choose Unassigned to clear the reporting line.";
  }, [managers.length, managerRequired, roleSlug, showManagerField]);

  const managerLabel = useMemo(() => {
    switch (roleSlug) {
      case "recruiter":
        return "Senior recruiter (manager)";
      case "senior-recruiter":
      case "office-admin":
        return "HR admin (manager)";
      default:
        return "Manager";
    }
  }, [roleSlug]);

  return (
    <div className="rounded-lg border border-border-color bg-card-background shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-color px-5 py-4">
        <div className="flex items-center gap-2">
          <Pencil className="h-4 w-4 text-gi-primary" aria-hidden />
          <h3 className="text-base font-semibold text-gi-primary">
            Edit profile
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Admin only — role, title, manager, and contact details
        </p>
      </div>

      <div className="space-y-4 p-5">
        <FormErrorSummary errors={edit.errors as Record<string, unknown>} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              First name
            </label>
            <input
              value={edit.values.first_name}
              onChange={(e) => edit.setField("first_name", e.target.value)}
              className={errorRingClass(!!edit.errors.first_name)}
              aria-invalid={!!edit.errors.first_name}
            />
            <FieldError message={edit.errors.first_name} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Last name
            </label>
            <input
              value={edit.values.last_name}
              onChange={(e) => edit.setField("last_name", e.target.value)}
              className={errorRingClass(!!edit.errors.last_name)}
              aria-invalid={!!edit.errors.last_name}
            />
            <FieldError message={edit.errors.last_name} />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5" />
              Job title
            </label>
            <input
              value={edit.values.title}
              onChange={(e) => edit.setField("title", e.target.value)}
              placeholder="e.g. Lead Recruiter, Talent Partner"
              className={errorRingClass(!!edit.errors.title)}
              aria-invalid={!!edit.errors.title}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Display title on their profile (optional).
            </p>
            <FieldError message={edit.errors.title} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              System role
            </label>
            <Select
              value={edit.values.role_slug || undefined}
              onValueChange={(value) =>
                edit.setRoleSlug(value as HrRoleSlug)
              }
            >
              <SelectTrigger
                className={errorRingClass(!!edit.errors.role_slug)}
              >
                <SelectValue placeholder="Select role…" />
              </SelectTrigger>
              <SelectContent>
                {HR_ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role.slug} value={role.slug}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              Controls permissions and reporting hierarchy.
            </p>
            <FieldError message={edit.errors.role_slug} />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              Email
            </label>
            <input
              type="email"
              value={edit.values.email}
              onChange={(e) => edit.setField("email", e.target.value)}
              placeholder="name@company.com"
              className={errorRingClass(!!edit.errors.email)}
              aria-invalid={!!edit.errors.email}
            />
            <FieldError message={edit.errors.email} />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              Phone
            </label>
            <input
              type="tel"
              value={edit.values.phone}
              onChange={(e) => edit.setField("phone", e.target.value)}
              placeholder="+971 …"
              className={errorRingClass(!!edit.errors.phone)}
              aria-invalid={!!edit.errors.phone}
            />
            <FieldError message={edit.errors.phone} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Account status
            </label>
            <Select
              value={edit.values.is_active ? "active" : "inactive"}
              onValueChange={(value) =>
                edit.setField("is_active", value === "active")
              }
            >
              <SelectTrigger
                className={errorRingClass(!!edit.errors.is_active)}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <FieldError message={edit.errors.is_active} />
          </div>

          {showManagerField && (
            <div className="md:col-span-2">
              <label className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {managerLabel}
                {managerRequired && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <Select
                value={edit.values.manager_id || NONE}
                onValueChange={(value) =>
                  edit.setField(
                    "manager_id",
                    value === NONE ? "" : value,
                  )
                }
              >
                <SelectTrigger
                  className={errorRingClass(!!edit.errors.manager_id)}
                >
                  <SelectValue
                    placeholder={
                      managerRequired
                        ? "Select manager…"
                        : "Unassigned"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {!managerRequired && (
                    <SelectItem value={NONE}>Unassigned</SelectItem>
                  )}
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.first_name} {manager.last_name}
                      {manager.role_name ? ` · ${manager.role_name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {managerHint && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {managerHint}
                </p>
              )}
              <FieldError message={edit.errors.manager_id} />
            </div>
          )}

          <div className="md:col-span-2">
            <label className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              Address
            </label>
            <textarea
              rows={2}
              value={edit.values.address}
              onChange={(e) => edit.setField("address", e.target.value)}
              placeholder="Office location or mailing address"
              className={errorRingClass(!!edit.errors.address)}
              aria-invalid={!!edit.errors.address}
            />
            <FieldError message={edit.errors.address} />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border-color pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={edit.reset}
            disabled={!edit.isDirty || edit.saving}
          >
            Reset
          </Button>
          <Button
            type="button"
            onClick={() => void edit.submit()}
            disabled={!edit.isDirty || edit.saving}
          >
            {edit.saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
