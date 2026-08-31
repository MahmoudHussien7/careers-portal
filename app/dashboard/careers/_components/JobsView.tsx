"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui";
import { Button } from "@/Components/atoms/Button";
import { ErrorBanner } from "@/Components/organisms/ErrorBanner";
import { LoadingSection } from "@/Components/organisms/LoadingSection";
import { EmptyState } from "@/Components/organisms/EmptyState";
import { Pagination } from "@/Components/organisms/Pagination";
import { useCareersStore } from "./CareersDataProvider";
import { MyJobsTable } from "./MyJobsTable";
import { JobCandidatesPanel } from "./JobCandidatesPanel";
import { JobPostingCard } from "./JobPostingCard";
import {
  getApplicationsForJob,
  useApplicationsByJob,
} from "./useApplicationsByJob";

const ALL = "__all__";

function QuestionnaireSuccessBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="rounded-lg border border-gi-primary/20 bg-gi-primary/5 px-4 py-3 text-sm text-gi-primary">
      {message}
      <button
        type="button"
        className="ml-3 font-medium underline hover:no-underline"
        onClick={onDismiss}
      >
        Dismiss
      </button>
    </div>
  );
}

function JobPostingsFilterBar({
  search,
  onSearchChange,
  onSubmit,
  statusId,
  statusOptions,
  onStatusChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  statusId?: string;
  statusOptions: Array<{ id: string; label: string }>;
  onStatusChange: (value: string) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-center gap-3 rounded-xl border border-border-color bg-card-background p-4 shadow-sm"
    >
      <div className="relative min-w-[280px] flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search title or slug…"
          className="w-full rounded-lg border border-border-color py-2.5 pl-10 pr-4 text-sm focus:border-gi-primary focus:outline-none focus:ring-2 focus:ring-gi-primary/20"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Status:
        </span>
        <Select value={statusId ?? ALL} onValueChange={onStatusChange}>
          <SelectTrigger className="min-w-[160px] rounded-lg">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" variant="secondary" className="font-semibold">
        Search
      </Button>
    </form>
  );
}

export function JobsView() {
  const {
    careers,
    jobForm,
    jobRecruiters,
    candidate,
    questionnaireSuccess,
    clearQuestionnaireSuccess,
  } = useCareersStore();
  const [search, setSearch] = useState(careers.jobFilters.search ?? "");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const applicationsByJob = useApplicationsByJob({
    applications: careers.applications,
    myApplications: careers.myApplications,
    canViewTeamApplications: careers.permissions.canViewTeamApplications,
  });

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    careers.setJobFilters((prev) => ({
      ...prev,
      page: 1,
      search: search.trim() || undefined,
    }));
  };

  const statusOptions = useMemo(
    () =>
      careers.statuses.map((status) => ({
        id: status.id,
        label: status.name,
      })),
    [careers.statuses],
  );

  const toggleJobExpanded = (jobId: string) => {
    setExpandedJobId((current) => (current === jobId ? null : jobId));
  };

  if (careers.loading) return <LoadingSection />;

  if (!careers.permissions.canManageJobs) {
    if (!careers.permissions.canViewMyJobs) {
      return (
        <EmptyState message="Your role does not have permission to view job postings." />
      );
    }
    return (
      <div className="space-y-6">
        <ErrorBanner
          message={careers.error}
          onDismiss={() => careers.setError(null)}
        />
        {questionnaireSuccess && (
          <QuestionnaireSuccessBanner
            message={questionnaireSuccess}
            onDismiss={clearQuestionnaireSuccess}
          />
        )}
        <MyJobsTable
          jobs={careers.myJobs}
          applicationsByJob={applicationsByJob}
          expandedJobId={expandedJobId}
          onToggleExpand={toggleJobExpanded}
          onView={careers.openJobView}
          onOpenCandidate={candidate.open}
        />
      </div>
    );
  }

  const totalJobs = careers.jobsPagination.total;

  return (
    <div className="space-y-6">
      <ErrorBanner
        message={careers.error}
        onDismiss={() => careers.setError(null)}
      />
      {questionnaireSuccess && (
        <QuestionnaireSuccessBanner
          message={questionnaireSuccess}
          onDismiss={clearQuestionnaireSuccess}
        />
      )}

      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gi-primary md:text-3xl">
            Job postings
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Manage your open positions and talent pipelines
            </p>
            {totalJobs > 0 && (
              <span className="rounded bg-gi-secondary/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gi-secondary">
                {totalJobs} total job{totalJobs === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>
        <Button
          onClick={jobForm.openCreate}
          className="w-full font-semibold shadow-sm sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          New job
        </Button>
      </div>

      <JobPostingsFilterBar
        search={search}
        onSearchChange={setSearch}
        onSubmit={submitSearch}
        statusId={careers.jobFilters.status_id}
        statusOptions={statusOptions}
        onStatusChange={(value) =>
          careers.setJobFilters((prev) => ({
            ...prev,
            page: 1,
            status_id: value === ALL ? undefined : value,
          }))
        }
      />

      {careers.jobs.length === 0 ? (
        <EmptyState message="No job postings yet. Create your first role to start receiving candidates.">
          <Button onClick={jobForm.openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New job
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {careers.jobs.map((job) => {
            const jobApplications = getApplicationsForJob(
              applicationsByJob,
              job.id,
            );
            const isExpanded = expandedJobId === job.id;

            return (
              <JobPostingCard
                key={job.id}
                job={job}
                candidateCount={jobApplications.length}
                isExpanded={isExpanded}
                onToggleExpand={() => toggleJobExpanded(job.id)}
                onView={() => careers.openJobView(job.id)}
                onEdit={() => void jobForm.openEdit(job.id)}
                onManageRecruiters={() => jobRecruiters.open(job)}
                onDelete={() => void careers.handleDeleteJob(job.id)}
                canManageRecruiters={careers.permissions.canManageJobRecruiters}
                expandedContent={
                  isExpanded ? (
                    <JobCandidatesPanel
                      jobId={job.id}
                      applications={jobApplications}
                      onOpenCandidate={candidate.open}
                    />
                  ) : null
                }
              />
            );
          })}
        </div>
      )}

      {careers.jobs.length > 0 && (
        <div className="border-t border-border-color pt-6">
          <Pagination
            pagination={careers.jobsPagination}
            onPageChange={(page) =>
              careers.setJobFilters((prev) => ({ ...prev, page }))
            }
            className="justify-between"
          />
        </div>
      )}
    </div>
  );
}
