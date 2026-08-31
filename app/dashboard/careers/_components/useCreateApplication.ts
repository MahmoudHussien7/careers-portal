"use client";

import { useCallback, useEffect, useState } from "react";
import * as dal from "@/lib/dal";
import { extractApiError } from "@/lib/utils";
import { useZodForm } from "@/hooks/useZodForm";
import { manualApplicationSchema } from "@/lib/schemas";
import type {
  ApplicationFormFieldMeta,
  CreateManualApplicationFormValues,
  JobPosting,
} from "@/types/careers";

export const initialManualApplicationForm: CreateManualApplicationFormValues = {
  jobId: "",
  applicationSourceId: "",
  fullName: "",
  email: "",
  mobileNumber: "",
  coverLetter: "",
  birthDate: "",
  nationalityId: "",
  currentAddress: "",
  yearsOfExperience: "",
  spokenLanguageIds: [],
  educationLevel: "",
  maritalStatus: "",
  gender: "",
  visaStatus: "",
  driverLicense: false,
  inDubaiNow: false,
  readyToJoinBy: "",
  acceptPrivacy: true,
  statusId: "",
};

interface UseCreateApplicationOptions {
  onSaved: () => void | Promise<void>;
  onError: (msg: string) => void;
  jobs: JobPosting[];
}

function appendIfPresent(fd: FormData, key: string, value: string | undefined) {
  if (value && value.trim()) fd.append(key, value.trim());
}

function parseFormFields(response: unknown): ApplicationFormFieldMeta[] {
  const r = response as {
    data?: {
      fields?: ApplicationFormFieldMeta[];
      create?: ApplicationFormFieldMeta[];
    };
    fields?: ApplicationFormFieldMeta[];
  };
  return r?.data?.create ?? r?.data?.fields ?? r?.fields ?? [];
}

function pickDefaultSource(sources: dal.LookupItem[]): string {
  return (
    sources.find((s) => s.slug === "manual-entry")?.id ??
    sources.find((s) => s.slug === "referral")?.id ??
    sources[0]?.id ??
    ""
  );
}

/**
 * Controls the "Add candidate manually" modal.
 * Submits multipart/form-data with a CV file (POST /api/admin/hr/applications).
 */
export function useCreateApplication({
  onSaved,
  onError,
  jobs,
}: UseCreateApplicationOptions) {
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);
  const [formFields, setFormFields] = useState<ApplicationFormFieldMeta[]>([]);
  const [sources, setSources] = useState<dal.LookupItem[]>([]);
  const [nationalities, setNationalities] = useState<dal.LookupItem[]>([]);
  const [languages, setLanguages] = useState<dal.LookupItem[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [prefillJobId, setPrefillJobId] = useState<string | undefined>();

  const form = useZodForm<
    typeof manualApplicationSchema,
    CreateManualApplicationFormValues
  >(initialManualApplicationForm, {
    schema: manualApplicationSchema,
  });

  const loadLookups = useCallback(async () => {
    setLookupsLoading(true);
    try {
      const [fieldsRes, sourcesRes, nationalitiesRes, languagesRes] =
        await Promise.allSettled([
          dal.getAdminHrApplicationFormFields(),
          dal.getApplicationSources(),
          dal.getNationalities(),
          dal.getLanguages(),
        ]);
      const nextSources =
        sourcesRes.status === "fulfilled" ? sourcesRes.value : [];
      if (fieldsRes.status === "fulfilled") {
        setFormFields(parseFormFields(fieldsRes.value));
      }
      setSources(nextSources);
      if (nationalitiesRes.status === "fulfilled") {
        setNationalities(nationalitiesRes.value);
      }
      if (languagesRes.status === "fulfilled") {
        setLanguages(languagesRes.value);
      }
      return nextSources;
    } finally {
      setLookupsLoading(false);
    }
  }, []);

  const open = useCallback(
    async (jobId?: string) => {
      setPrefillJobId(jobId);
      setCvFile(null);
      setCvError(null);
      form.reset({
        ...initialManualApplicationForm,
        jobId: jobId ?? "",
        acceptPrivacy: true,
      });
      setShow(true);
      const nextSources = await loadLookups();
      form.setField("applicationSourceId", pickDefaultSource(nextSources));
      if (jobId) form.setField("jobId", jobId);
    },
    [form, loadLookups],
  );

  const openCreate = useCallback(() => {
    void open();
  }, [open]);

  const close = useCallback(() => {
    if (saving) return;
    setShow(false);
    setCvFile(null);
    setCvError(null);
    setPrefillJobId(undefined);
    form.reset(initialManualApplicationForm);
  }, [form, saving]);

  const setCv = useCallback((file: File | null) => {
    setCvFile(file);
    setCvError(null);
  }, []);

  const toggleLanguage = useCallback(
    (id: string) => {
      const current = form.values.spokenLanguageIds;
      const next = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id];
      form.setField("spokenLanguageIds", next);
    },
    [form],
  );

  // Keep job prefill if jobs list arrives after modal opens
  useEffect(() => {
    if (show && prefillJobId && !form.values.jobId) {
      form.setField("jobId", prefillJobId);
    }
  }, [show, prefillJobId, form]);

  const submit = useCallback(async () => {
    if (!cvFile) {
      setCvError("CV file is required.");
      return;
    }
    const maxBytes = 10 * 1024 * 1024;
    if (cvFile.size > maxBytes) {
      setCvError("CV must be 10 MB or smaller.");
      return;
    }

    const parsed = form.handleSubmit();
    if (!parsed) return;

    let sourceId = parsed.applicationSourceId;
    if (!sourceId) {
      sourceId = pickDefaultSource(sources);
    }
    if (!sourceId) {
      onError("Application source failed to load. Please refresh and try again.");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("jobId", parsed.jobId);
      fd.append("applicationSourceId", sourceId);
      fd.append("fullName", parsed.fullName);
      fd.append("email", parsed.email);
      fd.append("mobileNumber", parsed.mobileNumber);
      fd.append("cv", cvFile);
      fd.append("acceptPrivacy", String(!!parsed.acceptPrivacy));

      appendIfPresent(fd, "coverLetter", parsed.coverLetter);
      appendIfPresent(fd, "birthDate", parsed.birthDate);
      appendIfPresent(fd, "nationalityId", parsed.nationalityId);
      appendIfPresent(fd, "currentAddress", parsed.currentAddress);
      appendIfPresent(fd, "educationLevel", parsed.educationLevel);
      appendIfPresent(fd, "maritalStatus", parsed.maritalStatus);
      appendIfPresent(fd, "gender", parsed.gender);
      appendIfPresent(fd, "visaStatus", parsed.visaStatus);
      appendIfPresent(fd, "readyToJoinBy", parsed.readyToJoinBy);
      appendIfPresent(fd, "statusId", parsed.statusId);

      if (parsed.yearsOfExperience?.trim()) {
        fd.append("yearsOfExperience", parsed.yearsOfExperience.trim());
      }
      if (parsed.spokenLanguageIds.length > 0) {
        fd.append("spokenLanguages", JSON.stringify(parsed.spokenLanguageIds));
      }
      fd.append("driverLicense", String(!!parsed.driverLicense));
      fd.append("inDubaiNow", String(!!parsed.inDubaiNow));

      await dal.createAdminHrApplication(fd);
      setShow(false);
      setCvFile(null);
      setPrefillJobId(undefined);
      form.reset(initialManualApplicationForm);
      await onSaved();
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      onError(
        extractApiError(
          err,
          status === 409
            ? "A candidate with this email or phone already applied for this job."
            : "Failed to create application.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }, [cvFile, form, onError, onSaved, sources]);

  return {
    show,
    saving,
    lookupsLoading,
    form: form.values,
    errors: form.errors,
    setField: form.setField,
    cvFile,
    cvError,
    setCv,
    formFields,
    sources,
    nationalities,
    languages,
    jobs,
    open,
    openCreate,
    close,
    submit,
    toggleLanguage,
  };
}
