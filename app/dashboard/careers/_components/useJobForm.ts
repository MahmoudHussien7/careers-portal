"use client";

import { useRef, useState } from "react";
import * as dal from "@/lib/dal";
import { useAuth } from "@/lib/auth";
import { extractApiError } from "@/lib/utils";
import type { JobPosting } from "@/types/careers";
import { useZodForm } from "@/hooks/useZodForm";
import { jobPostingSchema } from "@/lib/schemas";
import {
  JobFormState,
  initialJobForm,
  isoToDatetimeLocal,
  nowDatetimeLocal,
  titleToSlug,
} from "./careersForms";
import {
  apiToBulletLines,
  apiToRoleOverview,
} from "./careerContentFormat";
import {
  buildJobPostingPayload,
  DEFAULT_JOB_TIMEZONE,
  extractCreatedJobId,
  jobPostingBodyWithoutRecruiters,
  resolveJobPoolIdsForCreate,
  type JobFormLookups,
} from "./jobPayloadHelpers";

interface UseJobFormOptions {
  onSaved: () => void;
  onError: (msg: string) => void;
  lookups: JobFormLookups;
}

export type JobFormMode = "create" | "edit";

function toFormState(job: JobPosting): JobFormState {
  return {
    slug: job.slug ?? "",
    title: job.title ?? "",
    location: job.location ?? "",
    timezone: job.timezone ?? "",
    salary_range: job.salary_range ?? "",
    status_id: job.status?.id ?? "",
    department_id: job.department?.id ?? "",
    employment_type_id: job.employment_type?.id ?? "",
    team_id: job.team?.id ?? "",
    published_at: isoToDatetimeLocal(job.published_at),
    expires_at: isoToDatetimeLocal(job.expires_at),
    description: job.description ?? "",
    about_company: job.about_company ?? "",
    role_overview: apiToRoleOverview(job.role_overview),
    key_responsibilities: apiToBulletLines(job.key_responsibilities),
    candidate_profile: apiToBulletLines(job.candidate_profile),
    what_we_offer: apiToBulletLines(job.what_we_offer),
    user_ids: job.assigned_users?.map((u) => u.id) ?? [],
    screening_form_id: job.screening_form_id ?? job.screening_form?.id ?? "",
  };
}

/**
 * Controls the unified "Create / edit job posting" modal.
 *
 * Validation lives in `lib/schemas/careers.ts::jobPostingSchema`; every
 * field gets a Zod-driven error message and the Save button only fires
 * the API when the form passes validation.
 */
export function useJobForm({ onSaved, onError, lookups }: UseJobFormOptions) {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<JobFormMode>("create");
  const [jobId, setJobId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useZodForm<typeof jobPostingSchema, JobFormState>(initialJobForm, {
    schema: jobPostingSchema,
  });
  const slugManuallyEdited = useRef(false);

  const openCreate = () => {
    setMode("create");
    setJobId(null);
    slugManuallyEdited.current = false;
    const defaultStatus =
      lookups.statuses.find((s) => s.slug === "published") ??
      lookups.statuses.find((s) => s.slug === "draft") ??
      lookups.statuses[0];
    form.reset({
      ...initialJobForm,
      published_at: nowDatetimeLocal(),
      status_id: defaultStatus?.id ?? "",
      timezone: DEFAULT_JOB_TIMEZONE,
    });
    setShow(true);
  };

  const openEdit = async (id: string) => {
    setMode("edit");
    setJobId(id);
    slugManuallyEdited.current = true;
    form.reset(initialJobForm);
    setShow(true);
    setLoading(true);
    try {
      const response = await dal.getAdminJobPostingById(id);
      const job = response?.data?.job;
      if (job) form.setValues(toFormState(job));
    } catch (err) {
      onError(extractApiError(err, "Failed to load job posting."));
      setShow(false);
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setShow(false);
    setMode("create");
    setJobId(null);
    slugManuallyEdited.current = false;
    form.reset(initialJobForm);
  };

  const setTitle = (title: string) => {
    if (mode === "create" && !slugManuallyEdited.current) {
      form.setValues({
        ...form.values,
        title,
        slug: titleToSlug(title),
      });
    } else {
      form.setField("title", title);
    }
  };

  const setSlug = (slug: string) => {
    slugManuallyEdited.current = true;
    form.setField("slug", slug);
  };

  const toggleRecruiter = (userId: string) => {
    const current = form.values.user_ids;
    const next = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId];
    form.setField("user_ids", next);
  };

  const submit = async () => {
    const parsed = form.handleSubmit();
    if (!parsed) return;

    const payload = buildJobPostingPayload(parsed, lookups);
    const recruiterIds =
      mode === "create"
        ? resolveJobPoolIdsForCreate(payload.user_ids ?? [], lookups.hrUsers, {
            creatorId: user?.id,
            creatorRole: user?.roleSlug,
          })
        : (payload.user_ids ?? []);
    const body = jobPostingBodyWithoutRecruiters(payload);

    if (!body.status_id) {
      onError(
        "Please select a valid status. If the status list is empty, refresh the page — job statuses may have failed to load.",
      );
      return;
    }

    setSaving(true);
    try {
      if (mode === "edit" && jobId) {
        await dal.updateAdminJobPosting(jobId, body);
        await dal.replaceJobPostingRecruiters(jobId, { user_ids: recruiterIds });
      } else {
        const createRes = await dal.createAdminJobPosting(body);
        const createdId = extractCreatedJobId(createRes);
        if (!createdId) {
          onError(
            "Job was created but the assignee pool could not be set (missing job id in response).",
          );
          close();
          onSaved();
          return;
        }
        if (recruiterIds.length > 0) {
          await dal.replaceJobPostingRecruiters(createdId, {
            user_ids: recruiterIds,
          });
        } else {
          onError(
            "Job was created but no HR admin is available to assign. Add an HR admin to the directory so applications can be received.",
          );
          close();
          onSaved();
          return;
        }
      }
      close();
      onSaved();
    } catch (err) {
      onError(
        extractApiError(
          err,
          mode === "edit"
            ? "Failed to update job posting."
            : "Failed to create job posting. Use a status from the Job status dropdown (Draft / Published / Closed). Generic “Active” statuses will not work.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return {
    show,
    mode,
    form: form.values,
    setForm: form.setValues,
    setField: form.setField,
    setTitle,
    setSlug,
    errors: form.errors,
    saving,
    loading,
    openCreate,
    openEdit,
    close,
    submit,
    toggleRecruiter,
  };
}
