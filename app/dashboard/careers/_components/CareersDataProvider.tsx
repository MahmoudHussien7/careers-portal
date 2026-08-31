"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { applicationPhaseId } from "@/lib/careers/applicationPipeline";
import { useCareers } from "./useCareers";
import { useHrUserForm } from "./useHrUserForm";
import { useJobForm } from "./useJobForm";
import { useJobRecruiters } from "./useJobRecruiters";
import { useCandidateDetail } from "./useCandidateDetail";
import { useCreateApplication } from "./useCreateApplication";
import { useApplicationFeedback } from "./useApplicationFeedback";
import { useJobFormFill } from "./form-builder/useJobFormFill";
import { useJobForms } from "./form-builder/useJobForms";
import { CreateHrModal } from "./CreateHrModal";
import { CreateApplicationModal } from "./CreateApplicationModal";
import { JobFormModal } from "./JobFormModal";
import { JobViewModal } from "./JobViewModal";
import { JobRecruitersModal } from "./JobRecruitersModal";
import { CandidateDetailModal } from "./CandidateDetailModal";

type CareersValue = {
  careers: ReturnType<typeof useCareers>;
  hrUserForm: ReturnType<typeof useHrUserForm>;
  jobForm: ReturnType<typeof useJobForm>;
  jobRecruiters: ReturnType<typeof useJobRecruiters>;
  candidate: ReturnType<typeof useCandidateDetail>;
  createApplication: ReturnType<typeof useCreateApplication>;
  jobFormFill: ReturnType<typeof useJobFormFill>;
  questionnaireSuccess: string | null;
  clearQuestionnaireSuccess: () => void;
};

const CareersContext = createContext<CareersValue | null>(null);

export function CareersDataProvider({ children }: { children: ReactNode }) {
  const careers = useCareers();
  const [questionnaireSuccess, setQuestionnaireSuccess] = useState<
    string | null
  >(null);

  const feedbackGateRef = useRef<{
    requiredBeforePhaseChange: boolean;
    hasFeedbackForPhase: (phaseId: string | null | undefined) => boolean;
  }>({
    requiredBeforePhaseChange: false,
    hasFeedbackForPhase: () => true,
  });

  const getPhaseChangeBlockReason = useCallback(
    (currentPhaseId: string | undefined) => {
      const gate = feedbackGateRef.current;
      if (!gate.requiredBeforePhaseChange || !currentPhaseId) return null;
      if (gate.hasFeedbackForPhase(currentPhaseId)) return null;
      return "Add feedback for the current stage before moving this candidate to another phase.";
    },
    [],
  );

  const screeningJobs = useMemo(() => {
    const byId = new Map<string, (typeof careers.jobs)[number]>();
    for (const job of [...careers.jobs, ...careers.myJobs]) {
      byId.set(job.id, job);
    }
    return Array.from(byId.values());
  }, [careers.jobs, careers.myJobs]);

  const screeningFormsState = useJobForms();

  const hrUserForm = useHrUserForm({
    hrUsers: careers.hrUsers,
    onSaved: () => careers.loadHrUsers(),
    onError: careers.setError,
  });

  const jobForm = useJobForm({
    onSaved: async () => {
      await Promise.all([careers.loadJobs(), careers.loadMyWork()]);
      void screeningFormsState.refresh();
    },
    onError: careers.setError,
    lookups: {
      statuses: careers.statuses,
      departments: careers.departments,
      employmentTypes: careers.employmentTypes,
      teams: careers.teams,
      hrUsers: careers.hrUsers,
      screeningForms: screeningFormsState.forms,
    },
  });

  const jobRecruiters = useJobRecruiters({
    onSaved: async () => {
      await Promise.all([careers.loadJobs(), careers.refreshSelectedJob()]);
    },
    onError: careers.setError,
  });

  const candidate = useCandidateDetail({
    onSaved: async () => {
      await Promise.all([careers.loadApplications(), careers.loadHrUsers()]);
    },
    onError: careers.setError,
    applicationPipeline: careers.applicationPipeline,
    getPhaseChangeBlockReason,
  });

  const candidatePhaseId = candidate.application
    ? (applicationPhaseId(
        candidate.application,
        careers.applicationPipeline,
      ) ?? "")
    : "";

  const feedback = useApplicationFeedback({
    applicationId: candidate.application?.id,
    currentPhaseId: candidatePhaseId,
    applicationPipeline: careers.applicationPipeline,
    enabled: !!candidate.application,
    onError: careers.setError,
  });

  useEffect(() => {
    feedbackGateRef.current = {
      requiredBeforePhaseChange: feedback.config.requiredBeforePhaseChange,
      hasFeedbackForPhase: feedback.hasFeedbackForPhase,
    };
  }, [feedback.config.requiredBeforePhaseChange, feedback.hasFeedbackForPhase]);

  const createApplicationJobs = useMemo(() => {
    const byId = new Map<string, (typeof careers.jobs)[number]>();
    for (const job of [...careers.jobs, ...careers.myJobs]) {
      byId.set(job.id, job);
    }
    return Array.from(byId.values());
  }, [careers.jobs, careers.myJobs]);

  const createApplication = useCreateApplication({
    jobs: createApplicationJobs,
    onSaved: async () => {
      await Promise.all([
        careers.loadApplications(),
        careers.loadMyWork(),
      ]);
    },
    onError: careers.setError,
  });

  const jobFormFill = useJobFormFill({
    jobs: screeningJobs,
    onError: careers.setError,
    onSuccess: (message) => {
      setQuestionnaireSuccess(message);
      careers.setError(null);
    },
  });

  const handleQuestionnaireLoaded = useCallback(
    (hasSubmission: boolean) => {
      const applicationId = candidate.application?.id;
      if (!applicationId) return;
      jobFormFill.syncSubmissionState(applicationId, hasSubmission);
    },
    [candidate.application?.id, jobFormFill.syncSubmissionState],
  );

  return (
    <CareersContext.Provider
      value={{
        careers,
        hrUserForm,
        jobForm,
        jobRecruiters,
        candidate,
        createApplication,
        jobFormFill,
        questionnaireSuccess,
        clearQuestionnaireSuccess: () => setQuestionnaireSuccess(null),
      }}
    >
      {children}

      {/* Global modals — rendered once, triggered from any tab. */}
      <CreateHrModal
        open={hrUserForm.show}
        saving={hrUserForm.saving}
        form={hrUserForm.form}
        errors={hrUserForm.errors}
        setField={hrUserForm.setField}
        hrUsers={careers.hrUsers}
        onClose={hrUserForm.close}
        onSubmit={hrUserForm.submit}
      />

      <CreateApplicationModal
        open={createApplication.show}
        saving={createApplication.saving}
        lookupsLoading={createApplication.lookupsLoading}
        form={createApplication.form}
        errors={createApplication.errors}
        setField={createApplication.setField}
        cvFile={createApplication.cvFile}
        cvError={createApplication.cvError}
        setCv={createApplication.setCv}
        sources={createApplication.sources}
        nationalities={createApplication.nationalities}
        languages={createApplication.languages}
        jobs={createApplication.jobs}
        onToggleLanguage={createApplication.toggleLanguage}
        onClose={createApplication.close}
        onSubmit={createApplication.submit}
      />

      <JobFormModal
        open={jobForm.show}
        mode={jobForm.mode}
        saving={jobForm.saving}
        loading={jobForm.loading}
        form={jobForm.form}
        errors={jobForm.errors}
        setField={jobForm.setField}
        setTitle={jobForm.setTitle}
        setSlug={jobForm.setSlug}
        statuses={careers.statuses}
        departments={careers.departments}
        employmentTypes={careers.employmentTypes}
        teams={careers.teams}
        hrUsers={careers.hrUsers}
        screeningForms={screeningFormsState.forms}
        showRecruiterPool={careers.permissions.canManageJobRecruiters}
        onToggleRecruiter={jobForm.toggleRecruiter}
        onClose={jobForm.close}
        onSubmit={jobForm.submit}
      />

      <JobViewModal
        open={careers.jobView.isOpen}
        loading={careers.loadingJobDetail}
        job={careers.jobView.selected}
        canManageJobs={careers.permissions.canManageJobs}
        canManageRecruiters={careers.permissions.canManageJobRecruiters}
        onClose={careers.jobView.close}
        onEdit={() => {
          const id = careers.jobView.selected?.id;
          if (!id) return;
          careers.jobView.close();
          void jobForm.openEdit(id);
        }}
        onManageRecruiters={() => {
          const job = careers.jobView.selected;
          if (job) jobRecruiters.open(job);
        }}
      />

      <JobRecruitersModal
        job={jobRecruiters.job}
        hrUsers={careers.hrUsers}
        selectedIds={jobRecruiters.selectedIds}
        saving={jobRecruiters.saving}
        onToggle={jobRecruiters.toggle}
        onClose={jobRecruiters.close}
        onSave={jobRecruiters.save}
      />

      <CandidateDetailModal
        application={candidate.application}
        pending={candidate.pending}
        errors={candidate.errors}
        saving={candidate.saving}
        isDirty={candidate.isDirty}
        hrUsers={careers.hrUsers}
        applicationPipeline={careers.applicationPipeline}
        canEdit={careers.permissions.canViewMyWork}
        showQuestionnaire={
          !!candidate.application?.job_id &&
          jobFormFill.hasFormForJob(candidate.application.job_id)
        }
        questionnaireFilled={
          candidate.application
            ? jobFormFill.hasSubmittedForCandidate(candidate.application.id)
            : false
        }
        questionnaireRefreshKey={questionnaireSuccess}
        onQuestionnaireLoaded={handleQuestionnaireLoaded}
        onFillQuestionnaire={() => {
          if (!candidate.application) return;
          jobFormFill.openForCandidate(
            candidate.application,
            candidate.application.job_id ?? undefined,
          );
        }}
        feedback={feedback}
        onClose={candidate.close}
        onChange={candidate.updatePending}
        onSave={candidate.save}
      />

      {jobFormFill.modal}
    </CareersContext.Provider>
  );
}

export function useCareersStore(): CareersValue {
  const ctx = useContext(CareersContext);
  if (!ctx) {
    throw new Error(
      "useCareersStore must be used inside <CareersDataProvider />",
    );
  }
  return ctx;
}
