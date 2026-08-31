"use client";

import { useMemo, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  ClipboardList,
  Download,
  Eye,
  FileText,
  Mail,
  MapPin,
  Phone,
  School,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { Button } from "@/Components/atoms/Button";
import { FieldError, errorRingClass } from "@/Components/atoms/FieldError";
import { FormErrorSummary } from "@/Components/organisms/FormErrorSummary";
import { Modal } from "@/Components/organisms/Modal";
import { formatDate } from "@/lib/utils";
import type {
  ApplicationPipelinePhase,
  HrApplication,
  HrDirectoryUser,
  UpdateHrApplicationPayload,
} from "@/types/careers";
import { ApplicationLookupSelect } from "./ApplicationLookupSelect";
import { HrAssigneeSelect } from "./HrAssigneeSelect";
import {
  applicationAssigneeLabel,
  applicationPhaseId,
  applicationPhaseLabel,
  applicationStatusLabel,
  assigneeOptionsForApplication,
  pipelinePhaseItems,
  statusesForPhaseId,
} from "./applicationHelpers";
import {
  candidateFullName,
  candidateInitials,
  formatBool,
  formatDateOnly,
  resolveCvUrl,
} from "./candidateHelpers";
import { CandidateQuestionnaireSection } from "./CandidateQuestionnaireSection";
import { CandidateFeedbackSection } from "./CandidateFeedbackSection";
import type { useApplicationFeedback } from "./useApplicationFeedback";

type FieldErrors = Partial<
  Record<keyof UpdateHrApplicationPayload | "_root", string>
>;

type FeedbackController = ReturnType<typeof useApplicationFeedback>;

interface CandidateDetailModalProps {
  application: HrApplication | null;
  pending: UpdateHrApplicationPayload;
  errors: FieldErrors;
  saving: boolean;
  isDirty: boolean;
  hrUsers: HrDirectoryUser[];
  applicationPipeline: ApplicationPipelinePhase[];
  canEdit: boolean;
  showQuestionnaire?: boolean;
  questionnaireFilled?: boolean;
  questionnaireRefreshKey?: string | null;
  onQuestionnaireLoaded?: (hasSubmission: boolean) => void;
  onFillQuestionnaire?: () => void;
  feedback: FeedbackController;
  onClose: () => void;
  onChange: (field: keyof UpdateHrApplicationPayload, value: string) => void;
  onSave: () => void;
}

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-border-color pb-2">
      <Icon className="h-5 w-5 text-gi-primary" aria-hidden />
      <h3 className="text-base font-semibold text-gi-primary">{title}</h3>
    </div>
  );
}

function InfoField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm text-foreground">{children}</p>
    </div>
  );
}

function ContactPill({
  icon: Icon,
  children,
  href,
}: {
  icon: LucideIcon;
  children: ReactNode;
  href?: string;
}) {
  const pill = (
    <span className="inline-flex items-center gap-1.5 rounded bg-muted-background px-2 py-1 text-xs font-medium text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="truncate">{children}</span>
    </span>
  );

  if (href) {
    return (
      <a href={href} className="hover:opacity-80">
        {pill}
      </a>
    );
  }

  return pill;
}

export function CandidateDetailModal({
  application,
  pending,
  errors,
  saving,
  isDirty,
  hrUsers,
  applicationPipeline,
  canEdit,
  showQuestionnaire = false,
  questionnaireFilled = false,
  questionnaireRefreshKey = null,
  onQuestionnaireLoaded,
  onFillQuestionnaire,
  feedback,
  onClose,
  onChange,
  onSave,
}: CandidateDetailModalProps) {
  const assigneeOptions = useMemo(
    () => assigneeOptionsForApplication(hrUsers, application),
    [hrUsers, application],
  );
  const phaseItems = useMemo(
    () => pipelinePhaseItems(applicationPipeline),
    [applicationPipeline],
  );

  if (!application) return null;

  const applicationCurrentPhaseId =
    applicationPhaseId(application, applicationPipeline) ?? "";

  const currentPhaseId =
    pending.phase_id !== undefined
      ? (pending.phase_id ?? "")
      : applicationCurrentPhaseId;

  const statusPhaseId =
    pending.phase_id !== undefined && pending.phase_id !== null
      ? pending.phase_id
      : currentPhaseId;

  const editableStatuses = statusesForPhaseId(
    statusPhaseId,
    applicationPipeline,
  );
  const currentStatusId = pending.status_id ?? application.status_id ?? "";
  const currentAssignee =
    pending.assigned_to_user_id !== undefined
      ? (pending.assigned_to_user_id ?? "")
      : (application.assigned_to_user_id ?? "");
  const currentSource =
    pending.assignment_source ?? application.assignment_source ?? "";

  const fullName = candidateFullName(application);
  const initials = candidateInitials(application);
  const cvHref = resolveCvUrl(application);
  const cvLabel = application.cv_filename || application.cv_url || null;
  const statusLabel = applicationStatusLabel(application, applicationPipeline);
  const phaseLabel = applicationPhaseLabel(application, applicationPipeline);
  const assigneeLabel =
    applicationAssigneeLabel(application, hrUsers) ?? "Unassigned";

  const experienceLabel =
    application.years_of_experience != null &&
    application.years_of_experience !== ""
      ? `${application.years_of_experience} years`
      : "—";

  const availabilityLabel = application.ready_to_join_by
    ? formatDateOnly(application.ready_to_join_by)
    : application.in_dubai_now
      ? "Available now"
      : "—";

  const modalHeader = (
    <div className="border-b border-border-color bg-card-background p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gi-primary text-xl font-semibold text-white">
            {initials || <User className="h-7 w-7" />}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-gi-primary">
              {fullName}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {application.email && (
                <ContactPill icon={Mail} href={`mailto:${application.email}`}>
                  {application.email}
                </ContactPill>
              )}
              {application.phone && (
                <ContactPill icon={Phone}>{application.phone}</ContactPill>
              )}
              {application.current_address && (
                <ContactPill icon={MapPin}>
                  {application.current_address}
                </ContactPill>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
            {statusLabel}
          </span>
          <span className="rounded-full border border-gi-primary/20 bg-gi-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gi-primary">
            {phaseLabel}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted-background hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const modalFooter = (
    <div className="flex flex-col items-center justify-between gap-4 bg-card-background p-6 sm:flex-row">
      <Button
        variant="outline"
        onClick={onClose}
        className="w-full font-semibold sm:w-auto"
      >
        Close
      </Button>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        {showQuestionnaire && onFillQuestionnaire && (
          <Button
            variant="secondary"
            onClick={onFillQuestionnaire}
            className="w-full font-semibold sm:w-auto"
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            {questionnaireFilled
              ? "Update questionnaire"
              : "Fill questionnaire"}
          </Button>
        )}
        {canEdit && (
          <Button
            onClick={onSave}
            disabled={!isDirty || saving}
            className="w-full font-semibold shadow-md shadow-gi-primary/10 sm:w-auto"
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      open={!!application}
      onClose={onClose}
      size="5xl"
      flush
      header={modalHeader}
      footer={modalFooter}
      footerClassName="p-0"
      contentClassName="flex-1 overflow-y-auto p-6"
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left column — candidate profile */}
        <div className="space-y-8 lg:col-span-7">
          <section>
            <SectionHeading icon={User} title="Personal" />
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Birth date">
                {formatDateOnly(application.birth_date)}
              </InfoField>
              <InfoField label="Gender">{application.gender || "—"}</InfoField>
              <InfoField label="Nationality">
                {application.nationality_name || "—"}
              </InfoField>
              <InfoField label="Address">
                {application.current_address || "—"}
              </InfoField>
              <InfoField label="Marital status">
                {application.marital_status || "—"}
              </InfoField>
              <InfoField label="Locale">{application.locale || "—"}</InfoField>
            </div>
          </section>

          <section>
            <SectionHeading icon={Briefcase} title="Professional" />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Experience">
                  <span className="font-semibold">{experienceLabel}</span>
                </InfoField>
                <div>
                  <div className="mb-1 flex items-center gap-1">
                    <School className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Education
                    </p>
                  </div>
                  <p className="text-sm text-foreground">
                    {application.education_level || "—"}
                  </p>
                </div>
              </div>
              {application.spoken_languages &&
                application.spoken_languages.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Spoken languages
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {application.spoken_languages.map((language) => (
                        <span
                          key={language.id}
                          className="rounded-lg border border-border-color bg-muted-background px-2 py-1 text-xs font-medium text-foreground"
                        >
                          {language.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </section>

          <section>
            <SectionHeading icon={ShieldCheck} title="Eligibility" />
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Visa status">
                {application.visa_status || "—"}
              </InfoField>
              <InfoField label="Availability">{availabilityLabel}</InfoField>
              <InfoField label="In Dubai now">
                {formatBool(application.in_dubai_now)}
              </InfoField>
              <InfoField label="Driver license">
                {formatBool(application.driver_license)}
              </InfoField>
            </div>
          </section>

          {application.cover_letter && (
            <section>
              <SectionHeading icon={FileText} title="Cover letter" />
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {application.cover_letter}
              </p>
            </section>
          )}

          {application.notes && (
            <section>
              <SectionHeading icon={ClipboardList} title="Recruiter notes" />
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {application.notes}
              </p>
            </section>
          )}
        </div>

        {/* Right column — application context */}
        <div className="space-y-8 lg:col-span-5">
          <div className="relative overflow-hidden rounded-lg border border-border-color bg-muted-background/60 p-4 pl-5">
            <div className="absolute bottom-0 left-0 top-0 w-1 bg-gi-primary" />
            <div className="mb-3 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-gi-primary" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Application details
              </h4>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Applied for
                </p>
                <p className="text-sm font-bold text-gi-primary">
                  {application.job_title || "—"}
                </p>
              </div>
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Recruiter
                  </p>
                  <p className="text-sm text-foreground">{assigneeLabel}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Date applied
                  </p>
                  <p className="text-sm text-foreground">
                    {application.created_at
                      ? formatDateOnly(application.created_at)
                      : "—"}
                  </p>
                </div>
              </div>
              {application.job_status?.name && (
                <InfoField label="Job posting status">
                  {application.job_status.name}
                </InfoField>
              )}
              {application.assigned_at && (
                <InfoField label="Assigned at">
                  {formatDate(application.assigned_at)}
                </InfoField>
              )}
              {application.assignment_source && (
                <InfoField label="Assignment source">
                  {application.assignment_source}
                </InfoField>
              )}
            </div>
          </div>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-gi-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                CV / Resume
              </h3>
            </div>

            {cvLabel ? (
              <div className="group rounded-lg border border-border-color bg-card-background p-4 transition-colors hover:bg-muted-background/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded bg-red-50 p-2">
                      <FileText className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {cvLabel}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {application.cv_uploaded_at
                          ? `Uploaded ${formatDate(application.cv_uploaded_at)}`
                          : "On file"}
                      </p>
                    </div>
                  </div>
                  {cvHref && (
                    <div className="flex shrink-0 gap-1">
                      <a
                        href={cvHref}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded p-1.5 text-gi-primary transition-colors hover:bg-muted-background"
                        title="View document"
                      >
                        <Eye className="h-5 w-5" />
                      </a>
                      <a
                        href={cvHref}
                        download
                        className="rounded p-1.5 text-gi-primary transition-colors hover:bg-muted-background"
                        title="Download"
                      >
                        <Download className="h-5 w-5" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="relative mt-4 flex h-28 items-center justify-center overflow-hidden rounded-lg bg-muted-background">
                  <div className="absolute inset-0 bg-linear-to-br from-gi-primary/5 via-muted-background to-gi-secondary/10" />
                  <FileText className="relative h-10 w-10 text-muted-foreground/60 transition-transform group-hover:scale-110" />
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border-color p-6 text-center">
                <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No CV on file for this candidate yet.
                </p>
              </div>
            )}
          </section>

          {canEdit && (
            <section className="rounded-lg border border-gi-primary/15 bg-gi-primary/5 p-4">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gi-primary">
                Update application
              </h3>
              <FormErrorSummary
                errors={errors as Record<string, unknown>}
                className="mb-4"
              />
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </label>
                  <ApplicationLookupSelect
                    items={editableStatuses}
                    value={currentStatusId}
                    onChange={(statusId) => onChange("status_id", statusId)}
                    placeholder="Select status…"
                    emptyLabel="No change"
                    className="w-full"
                    size="default"
                  />
                  <FieldError message={errors.status_id} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Phase
                  </label>
                  <ApplicationLookupSelect
                    items={phaseItems}
                    value={currentPhaseId}
                    onChange={(phaseId) => onChange("phase_id", phaseId)}
                    placeholder="Select phase…"
                    emptyLabel="No change"
                    className="w-full"
                    size="default"
                  />
                  <FieldError
                    message={errors.phase_id ?? errors.pipeline_phase}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Assignee
                  </label>
                  <HrAssigneeSelect
                    users={assigneeOptions}
                    value={currentAssignee}
                    onChange={(assigneeId) =>
                      onChange("assigned_to_user_id", assigneeId)
                    }
                    invalid={!!errors.assigned_to_user_id}
                  />
                  <FieldError message={errors.assigned_to_user_id} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Assignment source
                  </label>
                  <input
                    value={currentSource}
                    onChange={(e) =>
                      onChange("assignment_source", e.target.value)
                    }
                    placeholder="e.g. LinkedIn, Referral"
                    className={errorRingClass(!!errors.assignment_source)}
                    aria-invalid={!!errors.assignment_source}
                  />
                  <FieldError message={errors.assignment_source} />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {showQuestionnaire && (
        <div className="mt-8 border-t border-border-color pt-8">
          <CandidateQuestionnaireSection
            applicationId={application.id}
            enabled={showQuestionnaire}
            refreshKey={questionnaireRefreshKey}
            onLoaded={onQuestionnaireLoaded}
          />
        </div>
      )}

      <CandidateFeedbackSection
        loading={feedback.loading}
        saving={feedback.saving}
        canEdit={canEdit}
        currentPhaseId={applicationCurrentPhaseId}
        config={feedback.config}
        recommendations={feedback.recommendations}
        applicationPipeline={applicationPipeline}
        phaseGroups={feedback.phaseGroups}
        showForm={feedback.showForm}
        form={feedback.form}
        errors={feedback.errors}
        attachmentFiles={feedback.attachmentFiles}
        blocksPhaseChange={feedback.blocksPhaseChange}
        onShowForm={feedback.setShowForm}
        onOpenFormForPhase={feedback.openFormForPhase}
        onChange={feedback.setField}
        onAttachmentsChange={feedback.setAttachmentFiles}
        onSubmit={feedback.submit}
      />
    </Modal>
  );
}
