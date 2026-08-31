"use client";

import { useMemo, useState } from "react";
import { Button } from "@/Components/atoms/Button";
import { Badge } from "@/Components/atoms/Badge";
import { FieldError, errorRingClass } from "@/Components/atoms/FieldError";
import { FormErrorSummary } from "@/Components/organisms/FormErrorSummary";
import { Modal } from "@/Components/organisms/Modal";
import { LoadingSection } from "@/Components/organisms/LoadingSection";
import { EmptyState } from "@/Components/organisms/EmptyState";
import type { LookupItem } from "@/lib/dal";
import type { HrDirectoryUser, HrRoleSlug } from "@/types/careers";
import { CAREER_SECTION_LABELS } from "./careerContentFormat";
import { JobContentPreview } from "./JobContentPreview";
import type { ScreeningFormListItem } from "@/types/screeningForm";
import { DEFAULT_JOB_TIMEZONE, JOB_POOL_ELIGIBLE_ROLES } from "./jobPayloadHelpers";
import { JobFormMode } from "./useJobForm";
import { JobFormState } from "./careersForms";
import { ScreeningFormSelect } from "./ScreeningFormSelect";

const inputClass =
  "w-full rounded-md border border-border-color px-3 py-2 text-sm focus:outline-none focus:ring-gi-primary focus:border-gi-primary";

interface JobFormModalProps {
  open: boolean;
  mode: JobFormMode;
  saving: boolean;
  loading: boolean;
  form: JobFormState;
  errors: Partial<Record<keyof JobFormState, string>>;
  setField: <K extends keyof JobFormState>(key: K, value: JobFormState[K]) => void;
  setTitle: (title: string) => void;
  setSlug: (slug: string) => void;
  statuses: LookupItem[];
  departments: LookupItem[];
  employmentTypes: LookupItem[];
  teams: LookupItem[];
  hrUsers: HrDirectoryUser[];
  screeningForms: ScreeningFormListItem[];
  showRecruiterPool: boolean;
  onToggleRecruiter: (userId: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="col-span-full border-b border-border-color pb-1 text-sm font-medium text-foreground">
      {children}
    </h3>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  error,
  placeholder,
  hint,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  hint?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-card-foreground">
        {label}
      </label>
      {hint && (
        <p className="mb-1.5 text-xs text-muted-foreground">{hint}</p>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`${inputClass} font-mono text-[13px] leading-relaxed ${errorRingClass(!!error)}`}
        aria-invalid={!!error}
      />
      <FieldError message={error} />
    </div>
  );
}

export function JobFormModal({
  open,
  mode,
  saving,
  loading,
  form,
  errors,
  setField,
  setTitle,
  setSlug,
  statuses,
  departments,
  employmentTypes,
  teams,
  hrUsers,
  screeningForms,
  showRecruiterPool,
  onToggleRecruiter,
  onClose,
  onSubmit,
}: JobFormModalProps) {
  const [recruiterSearch, setRecruiterSearch] = useState("");
  const title = mode === "edit" ? "Edit Job Posting" : "Create Job Posting";
  const submitLabel =
    mode === "edit"
      ? saving
        ? "Saving..."
        : "Save changes"
      : saving
        ? "Saving..."
        : "Create";

  const eligibleRecruiters = useMemo(
    () =>
      hrUsers.filter((person) =>
        JOB_POOL_ELIGIBLE_ROLES.includes(person.role_slug as HrRoleSlug),
      ),
    [hrUsers],
  );

  const filteredRecruiters = useMemo(() => {
    const term = recruiterSearch.trim().toLowerCase();
    if (!term) return eligibleRecruiters;
    return eligibleRecruiters.filter((person) =>
      `${person.first_name} ${person.last_name} ${person.email}`
        .toLowerCase()
        .includes(term),
    );
  }, [eligibleRecruiters, recruiterSearch]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="3xl"
      className="max-w-4xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={saving || loading}>
            {submitLabel}
          </Button>
        </>
      }
    >
      {loading ? (
        <LoadingSection />
      ) : (
        <div className="max-h-[min(70vh,640px)] overflow-y-auto pr-1">
          <FormErrorSummary errors={errors} className="mb-4" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <SectionHeading>Basics</SectionHeading>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-card-foreground">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="Senior Property Consultant"
                value={form.title}
                onChange={(e) => setTitle(e.target.value)}
                className={`${inputClass} ${errorRingClass(!!errors.title)}`}
                aria-invalid={!!errors.title}
              />
              <FieldError message={errors.title} />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-card-foreground">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="senior-property-consultant"
                value={form.slug}
                onChange={(e) => setSlug(e.target.value)}
                readOnly={mode === "create"}
                className={`${inputClass} ${errorRingClass(!!errors.slug)} ${
                  mode === "create" ? "cursor-default bg-muted-background text-muted-foreground" : ""
                }`}
                aria-invalid={!!errors.slug}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {mode === "create"
                  ? "Generated automatically from the title."
                  : "Edit only if you need a custom URL; otherwise it stays as saved."}
              </p>
              <FieldError message={errors.slug} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-card-foreground">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="Dubai, UAE"
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
                className={`${inputClass} ${errorRingClass(!!errors.location)}`}
                aria-invalid={!!errors.location}
              />
              <FieldError message={errors.location} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-card-foreground">
                Timezone
              </label>
              <input
                value={form.timezone || DEFAULT_JOB_TIMEZONE}
                onChange={(e) => setField("timezone", e.target.value)}
                readOnly={mode === "create"}
                className={`${inputClass} ${errorRingClass(!!errors.timezone)} ${
                  mode === "create" ? "cursor-default bg-muted-background text-muted-foreground" : ""
                }`}
                aria-invalid={!!errors.timezone}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Set automatically to {DEFAULT_JOB_TIMEZONE} on create.
              </p>
              <FieldError message={errors.timezone} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-card-foreground">
                Salary range
              </label>
              <input
                placeholder="AED 15,000 - 25,000"
                value={form.salary_range}
                onChange={(e) => setField("salary_range", e.target.value)}
                className={`${inputClass} ${errorRingClass(!!errors.salary_range)}`}
                aria-invalid={!!errors.salary_range}
              />
              <FieldError message={errors.salary_range} />
            </div>

            <SectionHeading>Classification</SectionHeading>

            <div>
              <label className="mb-1 block text-xs font-medium text-card-foreground">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={form.status_id}
                onChange={(e) => setField("status_id", e.target.value)}
                className={`${inputClass} ${errorRingClass(!!errors.status_id)}`}
                aria-invalid={!!errors.status_id}
              >
                <option value="">Select status</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
              <FieldError message={errors.status_id} />
              {statuses.length === 0 && (
                <p className="mt-1 text-xs text-amber-700">
                  Job statuses failed to load. Refresh the page — you must pick a
                  status from <code className="text-[11px]">job_statuses</code>, not
                  the generic statuses list.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-card-foreground">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                value={form.department_id}
                onChange={(e) => setField("department_id", e.target.value)}
                className={`${inputClass} ${errorRingClass(!!errors.department_id)}`}
                aria-invalid={!!errors.department_id}
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              <FieldError message={errors.department_id} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-card-foreground">
                Employment type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.employment_type_id}
                onChange={(e) => setField("employment_type_id", e.target.value)}
                className={`${inputClass} ${errorRingClass(!!errors.employment_type_id)}`}
                aria-invalid={!!errors.employment_type_id}
              >
                <option value="">Select type</option>
                {employmentTypes.map((employmentType) => (
                  <option key={employmentType.id} value={employmentType.id}>
                    {employmentType.name}
                  </option>
                ))}
              </select>
              <FieldError message={errors.employment_type_id} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-card-foreground">
                Team <span className="text-red-500">*</span>
              </label>
              <select
                value={form.team_id}
                onChange={(e) => setField("team_id", e.target.value)}
                className={`${inputClass} ${errorRingClass(!!errors.team_id)}`}
                aria-invalid={!!errors.team_id}
              >
                <option value="">Select team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <FieldError message={errors.team_id} />
            </div>

            <SectionHeading>Screening</SectionHeading>

            <div className="md:col-span-2">
              <ScreeningFormSelect
                forms={screeningForms}
                value={form.screening_form_id}
                onChange={(formId) => setField("screening_form_id", formId)}
                error={errors.screening_form_id}
                disabled={saving || loading}
              />
            </div>

            <SectionHeading>Schedule</SectionHeading>

            <div className="md:col-span-2 rounded-md bg-muted-background/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                <strong className="text-card-foreground">Publish time</strong> is
                set automatically when you save (current date &amp; time), unless
                status is draft.{" "}
                <strong className="text-card-foreground">Timezone</strong> defaults
                to {DEFAULT_JOB_TIMEZONE}.
                {mode === "edit" && form.published_at && (
                  <>
                    {" "}
                    Current publish: {form.published_at.replace("T", " ")}.
                  </>
                )}
              </p>
              <FieldError message={errors.published_at} />
            </div>

            <SectionHeading>Listing (API meta)</SectionHeading>

            <div className="md:col-span-2">
              <TextAreaField
                label="Description"
                value={form.description}
                onChange={(v) => setField("description", v)}
                error={errors.description}
                placeholder="Short summary for listings / SEO…"
                rows={2}
              />
            </div>

            <div className="md:col-span-2">
              <TextAreaField
                label="About company"
                value={form.about_company}
                onChange={(v) => setField("about_company", v)}
                error={errors.about_company}
                placeholder="Company blurb (if shown on the careers site)…"
                rows={2}
              />
            </div>

            <SectionHeading>Public job page (careers site)</SectionHeading>

            <div className="md:col-span-2">
              <JobContentPreview
                roleOverview={form.role_overview}
                keyResponsibilities={form.key_responsibilities}
                candidateProfile={form.candidate_profile}
                whatWeOffer={form.what_we_offer}
              />
            </div>

            <div className="md:col-span-2">
              <TextAreaField
                label={`${CAREER_SECTION_LABELS.roleOverview} *`}
                value={form.role_overview}
                onChange={(v) => setField("role_overview", v)}
                error={errors.role_overview}
                hint="Maps to roleOverviewParagraphs — one paragraph per block; use a blank line between paragraphs."
                placeholder={
                  "Support recruitment, onboarding, and employee records for a growing team."
                }
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <TextAreaField
                label={`${CAREER_SECTION_LABELS.keyResponsibilities} *`}
                value={form.key_responsibilities}
                onChange={(v) => setField("key_responsibilities", v)}
                error={errors.key_responsibilities}
                hint="Maps to keyResponse — one bullet per line (shown as a list on the site)."
                placeholder={
                  "Schedule interviews and communicate with candidates\nMaintain HR files and trackers\nAssist with HR events and policies"
                }
                rows={5}
              />
            </div>

            <div className="md:col-span-2">
              <TextAreaField
                label={`${CAREER_SECTION_LABELS.candidateProfile} *`}
                value={form.candidate_profile}
                onChange={(v) => setField("candidate_profile", v)}
                error={errors.candidate_profile}
                hint="Maps to candidateProfile — one bullet per line."
                placeholder={
                  "1-2 years HR coordination experience\nOrganized, discreet, and detail-oriented\nFluent English"
                }
                rows={4}
              />
            </div>

            <div className="md:col-span-2">
              <TextAreaField
                label={`${CAREER_SECTION_LABELS.whatWeOffer} *`}
                value={form.what_we_offer}
                onChange={(v) => setField("what_we_offer", v)}
                error={errors.what_we_offer}
                hint="Maps to whatWeOffer — one bullet per line."
                placeholder={
                  "Stable hours and hybrid options\nLearning budget\nAnnual leave as per UAE law"
                }
                rows={4}
              />
            </div>

            {showRecruiterPool && (
              <>
                <SectionHeading>
                  Recruiter pool (user_ids) · {form.user_ids.length} selected
                </SectionHeading>
                <div className="md:col-span-2 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Recruiters, senior recruiters, and HR admins who receive
                    applications for this job. If none are selected on create,
                    the creating HR admin is assigned automatically.
                  </p>
                  <input
                    placeholder="Search by name or email"
                    value={recruiterSearch}
                    onChange={(e) => setRecruiterSearch(e.target.value)}
                    className={inputClass}
                  />
                  <div className="max-h-48 overflow-y-auto rounded-md border border-border-color">
                    {filteredRecruiters.length === 0 ? (
                      <EmptyState
                        message={
                          eligibleRecruiters.length === 0
                            ? "No active recruiters in the directory yet."
                            : "No matching recruiters."
                        }
                      />
                    ) : (
                      <ul className="divide-y divide-border-color">
                        {filteredRecruiters.map((person) => {
                          const checked = form.user_ids.includes(person.id);
                          return (
                            <li
                              key={person.id}
                              className="flex items-center justify-between gap-3 px-3 py-2"
                            >
                              <label className="flex flex-1 cursor-pointer items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => onToggleRecruiter(person.id)}
                                  className="h-4 w-4 accent-gi-primary"
                                />
                                <div>
                                  <p className="text-sm font-medium text-foreground">
                                    {person.first_name} {person.last_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {person.email}
                                  </p>
                                </div>
                              </label>
                              <Badge tone="neutral">
                                {person.role_name || person.role_slug}
                              </Badge>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  <FieldError message={errors.user_ids} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
