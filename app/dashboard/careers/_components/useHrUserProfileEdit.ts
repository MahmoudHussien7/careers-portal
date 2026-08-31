"use client";

import { useEffect, useMemo, useState } from "react";
import * as dal from "@/lib/dal";
import { extractApiError } from "@/lib/utils";
import type { HrDirectoryUser, HrRoleSlug } from "@/types/careers";
import { useZodForm } from "@/hooks/useZodForm";
import { makeUpdateHrUserSchema } from "@/lib/schemas";

export type HrProfileEditState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  title: string;
  role_slug: HrRoleSlug | "";
  is_active: boolean;
  manager_id: string;
};

function toEditState(user: HrDirectoryUser): HrProfileEditState {
  return {
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    address: user.address ?? "",
    title: user.title ?? "",
    role_slug: (user.role_slug as HrRoleSlug) ?? "",
    is_active: user.is_active !== false,
    manager_id: user.manager_id ?? "",
  };
}

const ROLES_WITH_MANAGER: HrRoleSlug[] = [
  "recruiter",
  "senior-recruiter",
  "office-admin",
];

interface UseHrUserProfileEditOptions {
  user: HrDirectoryUser;
  hrUsers: HrDirectoryUser[];
  onSaved: () => void;
  onError: (message: string) => void;
}

export function useHrUserProfileEdit({
  user,
  hrUsers,
  onSaved,
  onError,
}: UseHrUserProfileEditOptions) {
  const [saving, setSaving] = useState(false);
  const baseline = useMemo(() => toEditState(user), [user]);
  const schema = useMemo(
    () => makeUpdateHrUserSchema(hrUsers),
    [hrUsers],
  );

  const form = useZodForm<
    ReturnType<typeof makeUpdateHrUserSchema>,
    HrProfileEditState
  >(baseline, { schema });

  useEffect(() => {
    form.reset(toEditState(user));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user.id,
    user.first_name,
    user.last_name,
    user.email,
    user.phone,
    user.address,
    user.title,
    user.role_slug,
    user.is_active,
    user.manager_id,
  ]);

  const isDirty = useMemo(() => {
    const current = form.values;
    return (
      current.first_name !== baseline.first_name ||
      current.last_name !== baseline.last_name ||
      current.email !== baseline.email ||
      current.phone !== baseline.phone ||
      current.address !== baseline.address ||
      current.title !== baseline.title ||
      current.role_slug !== baseline.role_slug ||
      current.is_active !== baseline.is_active ||
      current.manager_id !== baseline.manager_id
    );
  }, [form.values, baseline]);

  const setRoleSlug = (roleSlug: HrRoleSlug | "") => {
    form.setField("role_slug", roleSlug);
    form.setField("manager_id", "");
  };

  const submit = async () => {
    const parsed = form.handleSubmit();
    if (!parsed) return;

    setSaving(true);
    try {
      const role = parsed.role_slug as HrRoleSlug;
      const payload: Parameters<typeof dal.updateAdminHrUser>[1] = {
        first_name: parsed.first_name,
        last_name: parsed.last_name,
        email: parsed.email,
        phone: parsed.phone || undefined,
        address: parsed.address || undefined,
        title: parsed.title || undefined,
        role_slug: role,
        is_active: parsed.is_active,
      };

      if (role === "hr-admin") {
        payload.manager_id = null;
      } else if (ROLES_WITH_MANAGER.includes(role)) {
        payload.manager_id = parsed.manager_id || null;
      }

      await dal.updateAdminHrUser(user.id, payload);
      onSaved();
    } catch (err) {
      onError(extractApiError(err, "Failed to update profile."));
    } finally {
      setSaving(false);
    }
  };

  const reset = () => form.reset(toEditState(user));

  return {
    values: form.values,
    setField: form.setField,
    setRoleSlug,
    errors: form.errors,
    saving,
    isDirty,
    submit,
    reset,
  };
}
