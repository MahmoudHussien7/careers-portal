"use client";

import { useRef } from "react";
import {
  CheckCircle2,
  FileUp,
  MessageSquarePlus,
  Paperclip,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/Components/atoms/Button";
import { FieldError, errorRingClass } from "@/Components/atoms/FieldError";
import { FormErrorSummary } from "@/Components/organisms/FormErrorSummary";
import { LoadingSection } from "@/Components/organisms/LoadingSection";
import { formatDate } from "@/lib/utils";
import type { LookupItem } from "@/lib/dal";
import type {
  ApplicationFeedbackItem,
  ApplicationPipelinePhase,
  CreateApplicationFeedbackFormValues,
  HrFeedbackConfig,
} from "@/types/careers";
import { ApplicationLookupSelect } from "./ApplicationLookupSelect";
import { pipelinePhaseItems } from "./applicationHelpers";

const inputClass =
  "w-full rounded-md border border-border-color bg-card-background px-3 py-2 text-sm focus:border-gi-primary focus:outline-none focus:ring-2 focus:ring-gi-primary/20";

type FieldErrors = Partial<
  Record<keyof CreateApplicationFeedbackFormValues | "_root", string>
>;

interface PhaseGroup {
  phase: Pick<ApplicationPipelinePhase, "id" | "name" | "slug">;
  items: ApplicationFeedbackItem[];
}

interface CandidateFeedbackSectionProps {
  loading: boolean;
  saving: boolean;
  canEdit: boolean;
  currentPhaseId: string;
  config: HrFeedbackConfig;
  recommendations: LookupItem[];
  applicationPipeline: ApplicationPipelinePhase[];
  phaseGroups: PhaseGroup[];
  showForm: boolean;
  form: CreateApplicationFeedbackFormValues;
  errors: FieldErrors;
  attachmentFiles: File[];
  blocksPhaseChange: boolean;
  onShowForm: (show: boolean) => void;
  onOpenFormForPhase: (phaseId: string) => void;
  onChange: <K extends keyof CreateApplicationFeedbackFormValues>(
    key: K,
    value: CreateApplicationFeedbackFormValues[K],
  ) => void;
  onAttachmentsChange: (files: File[]) => void;
  onSubmit: () => void;
}

function authorLabel(item: ApplicationFeedbackItem): string {
  const first = item.author?.first_name?.trim() ?? "";
  const last = item.author?.last_name?.trim() ?? "";
  const name = `${first} ${last}`.trim();
  if (name) return name;
  return item.author?.email?.trim() || "Unknown author";
}

function FeedbackCard({ item, ratingMax }: { item: ApplicationFeedbackItem; ratingMax: number }) {
  return (
    <article className="rounded-lg border border-border-color bg-card-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h5 className="text-sm font-semibold text-foreground">
            {item.title || "Untitled feedback"}
          </h5>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {authorLabel(item)}
            {item.created_at ? ` · ${formatDate(item.created_at)}` : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {item.recommendation?.name && (
            <span className="rounded-full border border-gi-primary/20 bg-gi-primary/10 px-2.5 py-0.5 text-xs font-medium text-gi-primary">
              {item.recommendation.name}
            </span>
          )}
          {item.rating != null && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              <Star className="h-3 w-3 fill-current" aria-hidden />
              {item.rating}/{ratingMax}
            </span>
          )}
        </div>
      </div>
      {item.notes && (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {item.notes}
        </p>
      )}
      {item.attachments && item.attachments.length > 0 && (
        <ul className="mt-3 space-y-1">
          {item.attachments.map((file, index) => {
            const href = file.file_url;
            const label = file.file_name || file.file_url || `Attachment ${index + 1}`;
            return (
              <li key={`${href ?? label}-${index}`}>
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gi-primary hover:underline"
                  >
                    <Paperclip className="h-3.5 w-3.5" aria-hidden />
                    {label}
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Paperclip className="h-3.5 w-3.5" aria-hidden />
                    {label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}

export function CandidateFeedbackSection({
  loading,
  saving,
  canEdit,
  currentPhaseId,
  config,
  recommendations,
  applicationPipeline,
  phaseGroups,
  showForm,
  form,
  errors,
  attachmentFiles,
  blocksPhaseChange,
  onShowForm,
  onOpenFormForPhase,
  onChange,
  onAttachmentsChange,
  onSubmit,
}: CandidateFeedbackSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const phaseItems = pipelinePhaseItems(applicationPipeline);
  const ratingOptions = Array.from(
    { length: config.ratingMax },
    (_, i) => String(i + 1),
  );

  if (loading) {
    return (
      <section className="mt-8 border-t border-border-color pt-8">
        <LoadingSection />
      </section>
    );
  }

  return (
    <section className="mt-8 border-t border-border-color pt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="h-5 w-5 text-gi-primary" aria-hidden />
          <h3 className="text-base font-semibold text-gi-primary">
            Stage feedback
          </h3>
        </div>
        {canEdit && !showForm && (
          <Button
            variant="secondary"
            onClick={() => onOpenFormForPhase(currentPhaseId)}
            className="font-semibold"
          >
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            Add feedback
          </Button>
        )}
      </div>

      {blocksPhaseChange && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          Feedback is required for the current stage before moving this
          candidate to another phase.
        </div>
      )}

      {canEdit && showForm && (
        <div className="mb-6 rounded-lg border border-gi-primary/15 bg-gi-primary/5 p-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gi-primary">
              New stage feedback
            </h4>
            <button
              type="button"
              onClick={() => onShowForm(false)}
              className="rounded p-1 text-muted-foreground hover:bg-muted-background hover:text-foreground"
              aria-label="Cancel feedback form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <FormErrorSummary
            errors={errors as Record<string, unknown>}
            className="mb-4"
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                value={form.title}
                onChange={(e) => onChange("title", e.target.value)}
                placeholder="e.g. Screening call notes"
                className={errorRingClass(!!errors.title, inputClass)}
                aria-invalid={!!errors.title}
              />
              <FieldError message={errors.title} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Phase / stage <span className="text-red-500">*</span>
              </label>
              <ApplicationLookupSelect
                items={phaseItems}
                value={form.phaseId}
                onChange={(phaseId) => onChange("phaseId", phaseId)}
                placeholder="Select phase…"
                emptyLabel="Select phase…"
                className="w-full"
                size="default"
              />
              <FieldError message={errors.phaseId} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recommendation <span className="text-red-500">*</span>
              </label>
              <ApplicationLookupSelect
                items={recommendations}
                value={form.recommendationId}
                onChange={(id) => onChange("recommendationId", id)}
                placeholder="Select recommendation…"
                emptyLabel="Select recommendation…"
                className="w-full"
                size="default"
              />
              <FieldError message={errors.recommendationId} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rating (1–{config.ratingMax})
              </label>
              <ApplicationLookupSelect
                items={ratingOptions.map((value) => ({
                  id: value,
                  name: `${value} / ${config.ratingMax}`,
                }))}
                value={form.rating}
                onChange={(rating) => onChange("rating", rating)}
                placeholder="Optional rating…"
                emptyLabel="No rating"
                className="w-full"
                size="default"
              />
              <FieldError message={errors.rating} />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => onChange("notes", e.target.value)}
                rows={4}
                placeholder="Summarize the interview / screening outcome…"
                className={errorRingClass(!!errors.notes, inputClass)}
                aria-invalid={!!errors.notes}
              />
              <FieldError message={errors.notes} />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Attachments
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const next = Array.from(e.target.files ?? []);
                  onAttachmentsChange([...attachmentFiles, ...next]);
                  e.target.value = "";
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-semibold"
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  Add files
                </Button>
                {attachmentFiles.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {attachmentFiles.length} file
                    {attachmentFiles.length === 1 ? "" : "s"} selected
                  </span>
                )}
              </div>
              {attachmentFiles.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {attachmentFiles.map((file, index) => (
                    <li
                      key={`${file.name}-${file.size}-${index}`}
                      className="flex items-center justify-between gap-2 rounded border border-border-color bg-card-background px-2 py-1.5 text-xs"
                    >
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          onAttachmentsChange(
                            attachmentFiles.filter((_, i) => i !== index),
                          )
                        }
                        className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onShowForm(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={saving} className="font-semibold">
              {saving ? "Saving…" : "Save feedback"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {phaseGroups.map(({ phase, items }) => {
          const isCurrent = phase.id === currentPhaseId;
          const hasItems = items.length > 0;

          return (
            <div key={phase.id}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    {phase.name}
                  </h4>
                  {isCurrent && (
                    <span className="rounded-full border border-gi-primary/20 bg-gi-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gi-primary">
                      Current
                    </span>
                  )}
                  {hasItems ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-700">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      {items.length} entr{items.length === 1 ? "y" : "ies"}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No feedback yet
                    </span>
                  )}
                </div>
                {canEdit && !showForm && phase.id !== "__unknown__" && (
                  <Button
                    variant="outline"
                    onClick={() => onOpenFormForPhase(phase.id)}
                    className="h-8 px-2 text-xs font-semibold"
                  >
                    Add for this stage
                  </Button>
                )}
              </div>

              {hasItems ? (
                <div className="space-y-3">
                  {items.map((item) => (
                    <FeedbackCard
                      key={item.id}
                      item={item}
                      ratingMax={config.ratingMax}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border-color px-4 py-6 text-center text-sm text-muted-foreground">
                  No feedback recorded for {phase.name}.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
