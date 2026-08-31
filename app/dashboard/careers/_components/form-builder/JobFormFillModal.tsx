"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ScreeningForm,
  ScreeningFormQuestion,
  ScreeningSubmission,
} from "@/types/screeningForm";
import type { ScreeningAnswerDraft } from "@/lib/careers/screeningFormHelpers";
import { FieldError } from "@/Components/atoms/FieldError";
import { Button } from "@/Components/atoms/Button";
import { Modal } from "@/Components/organisms/Modal";
import { LoadingSection } from "@/Components/organisms/LoadingSection";

interface JobFormFillModalProps {
  open: boolean;
  loading?: boolean;
  form: ScreeningForm | null;
  jobTitle: string;
  candidateName: string;
  answers: Record<string, ScreeningAnswerDraft>;
  existingSubmission?: ScreeningSubmission | null;
  saving?: boolean;
  onClose: () => void;
  onChangeAnswer: (questionId: string, value: ScreeningAnswerDraft) => void;
  onSubmit: () => void;
}

function sortedQuestions(form: ScreeningForm | null): ScreeningFormQuestion[] {
  if (!form) return [];
  return [...form.questions].sort((a, b) => a.display_order - b.display_order);
}

export function JobFormFillModal({
  open,
  loading = false,
  form,
  jobTitle,
  candidateName,
  answers,
  existingSubmission,
  saving = false,
  onClose,
  onChangeAnswer,
  onSubmit,
}: JobFormFillModalProps) {
  const questions = useMemo(() => sortedQuestions(form), [form]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) setErrors({});
  }, [open, form?.id]);

  const hasExisting = !!existingSubmission;

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    for (const question of questions) {
      const value = answers[question.id];
      if (question.answer_type === "text") {
        if (!value?.answer_text?.trim()) {
          nextErrors[question.id] = "This answer is required.";
        }
      } else if (question.answer_type === "single_choice") {
        if (!value?.selected_option_id) {
          nextErrors[question.id] = "Select one option.";
        }
      } else if (!value?.selected_option_ids?.length) {
        nextErrors[question.id] = "Select at least one option.";
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!form || !validate()) return;
    onSubmit();
  };

  const title = useMemo(
    () =>
      hasExisting
        ? "Update interview questionnaire"
        : "Interview questionnaire",
    [hasExisting],
  );

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="3xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving || loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || loading || !form}>
            {saving
              ? "Saving…"
              : hasExisting
                ? "Update questionnaire"
                : "Save questionnaire"}
          </Button>
        </>
      }
    >
      {loading ? (
        <LoadingSection />
      ) : !form ? (
        <p className="text-sm text-muted-foreground">
          No screening form is available for this candidate.
        </p>
      ) : (
        <>
          <div className="mb-4 rounded-md border border-gi-primary/20 bg-muted-background/40 p-4">
            <p className="text-sm font-medium text-foreground">{form.title}</p>
            <p className="text-xs text-muted-foreground">
              Candidate: {candidateName || "—"}
            </p>
            <p className="text-xs text-muted-foreground">Job: {jobTitle}</p>
          </div>

          <div className="space-y-6">
            {questions.map((question) => {
              const value = answers[question.id] ?? {};
              const options = [...question.options].sort(
                (a, b) => a.display_order - b.display_order,
              );

              return (
                <section
                  key={question.id}
                  className="rounded-lg border border-border-color p-4"
                >
                  <p className="text-sm font-medium text-card-foreground">
                    {question.question_text}
                    <span className="ml-1 text-red-500">*</span>
                  </p>

                  {question.answer_type === "text" && (
                    <textarea
                      rows={3}
                      value={value.answer_text ?? ""}
                      onChange={(event) =>
                        onChangeAnswer(question.id, {
                          answer_text: event.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-md border border-border-color px-3 py-2 text-sm"
                      placeholder="Your answer"
                    />
                  )}

                  {question.answer_type === "single_choice" && (
                    <ul className="mt-2 space-y-2">
                      {options.map((option) => (
                        <li key={option.id}>
                          <label className="flex cursor-pointer items-center gap-2">
                            <input
                              type="radio"
                              name={`q-${question.id}`}
                              checked={value.selected_option_id === option.id}
                              onChange={() =>
                                onChangeAnswer(question.id, {
                                  selected_option_id: option.id,
                                })
                              }
                              className="h-4 w-4"
                            />
                            <span className="text-sm">{option.option_text}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}

                  {question.answer_type === "multiple_choice" && (
                    <ul className="mt-2 space-y-2">
                      {options.map((option) => {
                        const selected = value.selected_option_ids?.includes(
                          option.id,
                        );
                        return (
                          <li key={option.id}>
                            <label className="flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                checked={!!selected}
                                onChange={(event) => {
                                  const current = new Set(
                                    value.selected_option_ids ?? [],
                                  );
                                  if (event.target.checked) {
                                    current.add(option.id);
                                  } else {
                                    current.delete(option.id);
                                  }
                                  onChangeAnswer(question.id, {
                                    selected_option_ids: Array.from(current),
                                  });
                                }}
                                className="h-4 w-4 rounded"
                              />
                              <span className="text-sm">{option.option_text}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <FieldError message={errors[question.id]} />
                </section>
              );
            })}
          </div>
        </>
      )}
    </Modal>
  );
}
