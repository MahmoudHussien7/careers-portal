"use client";

import { useMemo } from "react";
import { FileUp, UserPlus } from "lucide-react";
import { Button } from "@/Components/atoms/Button";
import { FieldError, errorRingClass } from "@/Components/atoms/FieldError";
import { FormErrorSummary } from "@/Components/organisms/FormErrorSummary";
import { Modal } from "@/Components/organisms/Modal";
import type { LookupItem } from "@/lib/dal";
import type {
  CreateManualApplicationFormValues,
  JobPosting,
} from "@/types/careers";
import { ApplicationLookupSelect } from "./ApplicationLookupSelect";

const inputClass =
  "w-full rounded-md border border-border-color bg-card-background px-3 py-2 text-sm focus:border-gi-primary focus:outline-none focus:ring-2 focus:ring-gi-primary/20";

interface CreateApplicationModalProps {
  open: boolean;
  saving: boolean;
  lookupsLoading: boolean;
  form: CreateManualApplicationFormValues;
  errors: Partial<Record<keyof CreateManualApplicationFormValues, string>>;
  setField: <K extends keyof CreateManualApplicationFormValues>(
    key: K,
    value: CreateManualApplicationFormValues[K],
  ) => void;
  cvFile: File | null;
  cvError: string | null;
  setCv: (file: File | null) => void;
  sources: LookupItem[];
  nationalities: LookupItem[];
  languages: LookupItem[];
  jobs: JobPosting[];
  onToggleLanguage: (id: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h4 className="border-b border-border-color pb-1 text-sm font-semibold text-gi-primary">
        {title}
      </h4>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="mb-1 block text-xs font-medium text-card-foreground">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

export function CreateApplicationModal({
  open,
  saving,
  lookupsLoading,
  form,
  errors,
  setField,
  cvFile,
  cvError,
  setCv,
  sources,
  nationalities,
  languages,
  jobs,
  onToggleLanguage,
  onClose,
  onSubmit,
}: CreateApplicationModalProps) {
  const jobOptions = useMemo(() => {
    const byId = new Map<string, JobPosting>();
    for (const job of jobs) byId.set(job.id, job);
    return Array.from(byId.values()).sort((a, b) =>
      (a.title || "").localeCompare(b.title || ""),
    );
  }, [jobs]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="3xl"
      title="Add candidate manually"
      header={
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-gi-primary/10 p-2 text-gi-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Add candidate manually
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Create an application for a candidate sourced outside the
                Careers site (referral, LinkedIn, hunting, etc.).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-card-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={saving || lookupsLoading}>
            {saving ? "Creating…" : "Create application"}
          </Button>
        </>
      }
    >
      <FormErrorSummary errors={errors} />

      <div className="max-h-[65vh] space-y-6 overflow-y-auto pr-1">
        <Section title="Job & source">
          <div>
            <Label required>Job posting</Label>
            <select
              value={form.jobId}
              onChange={(e) => setField("jobId", e.target.value)}
              className={errorRingClass(!!errors.jobId, inputClass)}
              aria-invalid={!!errors.jobId}
              disabled={lookupsLoading}
            >
              <option value="">Select job…</option>
              {jobOptions.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                  {job.status?.name ? ` (${job.status.name})` : ""}
                </option>
              ))}
            </select>
            <FieldError message={errors.jobId} />
          </div>

          <div>
            <Label required>Application source</Label>
            <ApplicationLookupSelect
              items={sources}
              value={form.applicationSourceId}
              onChange={(id) => setField("applicationSourceId", id)}
              placeholder="Select source…"
              emptyLabel="Select source…"
              className="w-full"
              disabled={lookupsLoading}
            />
            <FieldError message={errors.applicationSourceId} />
          </div>
        </Section>

        <Section title="Candidate">
          <div className="md:col-span-2">
            <Label required>Full name</Label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setField("fullName", e.target.value)}
              className={errorRingClass(!!errors.fullName, inputClass)}
              placeholder="e.g. Sara Ahmed"
              aria-invalid={!!errors.fullName}
            />
            <FieldError message={errors.fullName} />
          </div>

          <div>
            <Label required>Email</Label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              className={errorRingClass(!!errors.email, inputClass)}
              placeholder="name@example.com"
              aria-invalid={!!errors.email}
            />
            <FieldError message={errors.email} />
          </div>

          <div>
            <Label required>Mobile number</Label>
            <input
              type="tel"
              value={form.mobileNumber}
              onChange={(e) => setField("mobileNumber", e.target.value)}
              className={errorRingClass(!!errors.mobileNumber, inputClass)}
              placeholder="+971501234567"
              aria-invalid={!!errors.mobileNumber}
            />
            <FieldError message={errors.mobileNumber} />
          </div>

          <div className="md:col-span-2">
            <Label required>CV</Label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gi-primary/40 bg-gi-primary/3 px-4 py-6 text-center transition-colors hover:bg-gi-primary/6">
              <FileUp className="h-6 w-6 text-gi-primary" />
              <span className="text-sm font-medium text-foreground">
                {cvFile ? cvFile.name : "Upload CV (PDF, DOC, DOCX)"}
              </span>
              <span className="text-xs text-muted-foreground">
                Max 10 MB · required
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                onChange={(e) => setCv(e.target.files?.[0] ?? null)}
              />
            </label>
            {cvFile && (
              <button
                type="button"
                onClick={() => setCv(null)}
                className="mt-1 text-xs font-medium text-gi-primary hover:underline"
              >
                Remove file
              </button>
            )}
            <FieldError message={cvError ?? undefined} />
          </div>

          <div className="md:col-span-2">
            <Label>Cover letter</Label>
            <textarea
              value={form.coverLetter}
              onChange={(e) => setField("coverLetter", e.target.value)}
              rows={3}
              className={errorRingClass(!!errors.coverLetter, inputClass)}
              placeholder="Optional notes or cover letter…"
            />
            <FieldError message={errors.coverLetter} />
          </div>
        </Section>

        <Section title="Profile details">
          <div>
            <Label>Birth date</Label>
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) => setField("birthDate", e.target.value)}
              className={errorRingClass(!!errors.birthDate, inputClass)}
            />
            <FieldError message={errors.birthDate} />
          </div>

          <div>
            <Label>Nationality</Label>
            <ApplicationLookupSelect
              items={nationalities}
              value={form.nationalityId}
              onChange={(id) => setField("nationalityId", id)}
              placeholder="Select nationality…"
              emptyLabel="—"
              className="w-full"
              disabled={lookupsLoading}
            />
            <FieldError message={errors.nationalityId} />
          </div>

          <div className="md:col-span-2">
            <Label>Current address</Label>
            <input
              type="text"
              value={form.currentAddress}
              onChange={(e) => setField("currentAddress", e.target.value)}
              className={errorRingClass(!!errors.currentAddress, inputClass)}
              placeholder="City, country…"
            />
            <FieldError message={errors.currentAddress} />
          </div>

          <div>
            <Label>Years of experience</Label>
            <input
              type="number"
              min={0}
              max={60}
              step={0.5}
              value={form.yearsOfExperience}
              onChange={(e) => setField("yearsOfExperience", e.target.value)}
              className={errorRingClass(!!errors.yearsOfExperience, inputClass)}
              placeholder="e.g. 3"
            />
            <FieldError message={errors.yearsOfExperience} />
          </div>

          <div>
            <Label>Education level</Label>
            <input
              type="text"
              value={form.educationLevel}
              onChange={(e) => setField("educationLevel", e.target.value)}
              className={errorRingClass(!!errors.educationLevel, inputClass)}
              placeholder="e.g. Bachelor's"
            />
            <FieldError message={errors.educationLevel} />
          </div>

          <div>
            <Label>Gender</Label>
            <select
              value={form.gender}
              onChange={(e) => setField("gender", e.target.value)}
              className={errorRingClass(!!errors.gender, inputClass)}
            >
              <option value="">—</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
            <FieldError message={errors.gender} />
          </div>

          <div>
            <Label>Marital status</Label>
            <select
              value={form.maritalStatus}
              onChange={(e) => setField("maritalStatus", e.target.value)}
              className={errorRingClass(!!errors.maritalStatus, inputClass)}
            >
              <option value="">—</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
            <FieldError message={errors.maritalStatus} />
          </div>

          <div>
            <Label>Visa status</Label>
            <input
              type="text"
              value={form.visaStatus}
              onChange={(e) => setField("visaStatus", e.target.value)}
              className={errorRingClass(!!errors.visaStatus, inputClass)}
              placeholder="e.g. Residence visa"
            />
            <FieldError message={errors.visaStatus} />
          </div>

          <div>
            <Label>Ready to join by</Label>
            <input
              type="date"
              value={form.readyToJoinBy}
              onChange={(e) => setField("readyToJoinBy", e.target.value)}
              className={errorRingClass(!!errors.readyToJoinBy, inputClass)}
            />
            <FieldError message={errors.readyToJoinBy} />
          </div>

          <div className="md:col-span-2">
            <Label>Spoken languages</Label>
            <div className="max-h-36 overflow-y-auto rounded-md border border-border-color p-2">
              {languages.length === 0 ? (
                <p className="px-1 py-2 text-xs text-muted-foreground">
                  {lookupsLoading ? "Loading languages…" : "No languages loaded."}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang) => {
                    const active = form.spokenLanguageIds.includes(lang.id);
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => onToggleLanguage(lang.id)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                          active
                            ? "bg-gi-primary text-white"
                            : "bg-muted-background text-card-foreground hover:bg-accent-background"
                        }`}
                      >
                        {lang.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <FieldError message={errors.spokenLanguageIds} />
          </div>

          <div className="md:col-span-2 flex flex-wrap gap-5 pt-1">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.driverLicense}
                onChange={(e) => setField("driverLicense", e.target.checked)}
                className="rounded border-border-color text-gi-primary focus:ring-gi-primary"
              />
              Driver license
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.inDubaiNow}
                onChange={(e) => setField("inDubaiNow", e.target.checked)}
                className="rounded border-border-color text-gi-primary focus:ring-gi-primary"
              />
              Currently in Dubai
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.acceptPrivacy}
                onChange={(e) => setField("acceptPrivacy", e.target.checked)}
                className="rounded border-border-color text-gi-primary focus:ring-gi-primary"
              />
              Privacy consent
            </label>
          </div>
        </Section>
      </div>
    </Modal>
  );
}
