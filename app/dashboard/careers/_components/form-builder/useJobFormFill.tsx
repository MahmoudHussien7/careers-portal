"use client";

import { useCallback, useState } from "react";
import * as dal from "@/lib/dal";
import { extractApiError } from "@/lib/utils";
import {
  draftsToSavePayload,
  submissionAnswersToDrafts,
  type ScreeningAnswerDraft,
} from "@/lib/careers/screeningFormHelpers";
import type { ApplicationScreeningData } from "@/types/screeningForm";
import type { HrApplication, JobPosting } from "@/types/careers";
import { candidateFullName } from "../candidateHelpers";
import { JobFormFillModal } from "./JobFormFillModal";

interface UseJobFormFillOptions {
  jobs: JobPosting[];
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function useJobFormFill({
  jobs,
  onError,
  onSuccess,
}: UseJobFormFillOptions) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [screening, setScreening] = useState<ApplicationScreeningData | null>(
    null,
  );
  const [activeApplication, setActiveApplication] =
    useState<HrApplication | null>(null);
  const [answers, setAnswers] = useState<Record<string, ScreeningAnswerDraft>>(
    {},
  );
  const [submissionByApplication, setSubmissionByApplication] = useState<
    Record<string, boolean>
  >({});

  const hasFormForJob = useCallback(
    (jobId: string) => {
      const job = jobs.find((item) => item.id === jobId);
      return !!job?.screening_form_id;
    },
    [jobs],
  );

  const hasSubmittedForCandidate = useCallback(
    (applicationId: string) => submissionByApplication[applicationId] ?? false,
    [submissionByApplication],
  );

  const syncSubmissionState = useCallback(
    (applicationId: string, hasSubmission: boolean) => {
      setSubmissionByApplication((prev) => ({
        ...prev,
        [applicationId]: hasSubmission,
      }));
    },
    [],
  );

  const close = useCallback(() => {
    setOpen(false);
    setScreening(null);
    setActiveApplication(null);
    setAnswers({});
  }, []);

  const openForCandidate = useCallback(
    async (application: HrApplication, fallbackJobId?: string) => {
      setLoading(true);
      try {
        const response = await dal.getAdminApplicationScreening(application.id);
        const data = response?.data;
        if (!data?.screening_form) {
          onError(
            "No screening questionnaire is linked to this job posting yet.",
          );
          return;
        }
        setScreening(data);
        setActiveApplication({
          ...application,
          job_id: application.job_id ?? fallbackJobId ?? null,
          job_title:
            application.job_title ??
            jobs.find((job) => job.id === (application.job_id ?? fallbackJobId))
              ?.title ??
            null,
        });
        setAnswers(
          submissionAnswersToDrafts(
            data.screening_form.questions,
            data.submission?.answers ?? [],
          ),
        );
        setSubmissionByApplication((prev) => ({
          ...prev,
          [application.id]: !!data.submission,
        }));
        setOpen(true);
      } catch (err) {
        onError(extractApiError(err, "Failed to load screening questionnaire."));
      } finally {
        setLoading(false);
      }
    },
    [jobs, onError],
  );

  const submit = useCallback(async () => {
    if (!screening?.screening_form || !activeApplication) return;
    setSaving(true);
    try {
      const hadExisting = !!screening.submission;
      const payload = draftsToSavePayload(screening.screening_form.questions, answers);
      const response = await dal.saveAdminApplicationScreening(
        activeApplication.id,
        { answers: payload },
      );
      const saved = response?.data;
      if (saved?.screening_form) {
        setScreening(saved);
        setAnswers(
          submissionAnswersToDrafts(
            saved.screening_form.questions,
            saved.submission?.answers ?? [],
          ),
        );
      }
      setSubmissionByApplication((prev) => ({
        ...prev,
        [activeApplication.id]: true,
      }));
      onSuccess(
        hadExisting
          ? "Questionnaire updated for this candidate."
          : "Questionnaire saved for this candidate.",
      );
      close();
    } catch (err) {
      onError(extractApiError(err, "Failed to save screening questionnaire."));
    } finally {
      setSaving(false);
    }
  }, [activeApplication, answers, close, onError, onSuccess, screening]);

  const candidateName = activeApplication
    ? candidateFullName(activeApplication)
    : "";

  const jobTitle =
    activeApplication?.job_title ??
    jobs.find((job) => job.id === activeApplication?.job_id)?.title ??
    "";

  const modal = (
    <JobFormFillModal
      open={open}
      loading={loading}
      form={screening?.screening_form ?? null}
      jobTitle={jobTitle}
      candidateName={candidateName}
      answers={answers}
      existingSubmission={screening?.submission ?? null}
      saving={saving}
      onClose={close}
      onChangeAnswer={(questionId, value) =>
        setAnswers((prev) => ({ ...prev, [questionId]: value }))
      }
      onSubmit={() => void submit()}
    />
  );

  return {
    openForCandidate,
    hasFormForJob,
    hasSubmittedForCandidate,
    syncSubmissionState,
    modal,
  };
}
