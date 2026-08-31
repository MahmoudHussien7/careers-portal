"use client";

import { EmptyState } from "@/Components/organisms/EmptyState";
import type { HrApplication, JobPosting } from "@/types/careers";
import { JobCandidatesPanel } from "./JobCandidatesPanel";
import { JobPostingCard } from "./JobPostingCard";
import { getApplicationsForJob } from "./useApplicationsByJob";

interface Props {
  jobs: JobPosting[];
  applicationsByJob: Map<string, HrApplication[]>;
  expandedJobId: string | null;
  onToggleExpand: (jobId: string) => void;
  onView: (id: string) => void;
  onOpenCandidate: (application: HrApplication) => void;
}

/**
 * Read-only card listing of jobs the current recruiter is assigned to via
 * `GET /admin/hr/me/jobs`. Expand a card to see recent applicants.
 */
export function MyJobsTable({
  jobs,
  applicationsByJob,
  expandedJobId,
  onToggleExpand,
  onView,
  onOpenCandidate,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gi-primary md:text-3xl">
          My job postings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Roles you&apos;re assigned to — expand a card to review applicants
        </p>
        {jobs.length > 0 && (
          <span className="mt-2 inline-block rounded bg-gi-secondary/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gi-secondary">
            {jobs.length} assigned job{jobs.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {jobs.length === 0 ? (
        <EmptyState message="You have no jobs assigned yet." />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
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
                onToggleExpand={() => onToggleExpand(job.id)}
                onView={() => onView(job.id)}
                readOnly
                expandedContent={
                  isExpanded ? (
                    <JobCandidatesPanel
                      jobId={job.id}
                      applications={jobApplications}
                      onOpenCandidate={onOpenCandidate}
                    />
                  ) : null
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
