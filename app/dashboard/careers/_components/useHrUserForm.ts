"use client";

import { useMemo, useState } from "react";
import * as dal from "@/lib/dal";
import { extractApiError } from "@/lib/utils";
import type { HrDirectoryUser, HrRoleSlug } from "@/types/careers";
import { useZodForm } from "@/hooks/useZodForm";
import { makeHrUserSchema } from "@/lib/schemas";
import { HrFormState, initialHrForm } from "./careersForms";

interface UseHrUserFormOptions {
  hrUsers: HrDirectoryUser[];
  onSaved: () => void;
  onError: (msg: string) => void;
}

/**
 * Controls the "Create HR User" modal.
 *
 * Every field is validated via Zod through `useZodForm`. We rebuild the
 * schema whenever `hrUsers` changes because the `manager_id` rule depends
 * on the directory (the selected manager must have a valid role for the
 * new hire).
 */
export function useHrUserForm({
  hrUsers,
  onSaved,
  onError,
}: UseHrUserFormOptions) {
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const schema = useMemo(() => makeHrUserSchema(hrUsers), [hrUsers]);

  const form = useZodForm<typeof schema, HrFormState>(initialHrForm, {
    schema,
  });

  const open = () => {
    form.reset(initialHrForm);
    setShow(true);
  };

  const close = () => {
    setShow(false);
    form.reset(initialHrForm);
  };

  const submit = async () => {
    const parsed = form.handleSubmit();
    if (!parsed) return;

    setSaving(true);
    try {
      await dal.createAdminHrUser({
        email: parsed.email,
        password: parsed.password,
        first_name: parsed.first_name,
        last_name: parsed.last_name,
        phone: parsed.phone || undefined,
        role_slug: parsed.role_slug as HrRoleSlug,
        manager_id: parsed.manager_id || undefined,
      });
      close();
      onSaved();
    } catch (err) {
      onError(extractApiError(err, "Failed to create HR user."));
    } finally {
      setSaving(false);
    }
  };

  return {
    show,
    form: form.values,
    setForm: form.setValues,
    setField: form.setField,
    errors: form.errors,
    saving,
    open,
    close,
    submit,
  };
}
