"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Pagination } from "@/Components/organisms/Pagination";
import { cn } from "@/lib/utils";
import type { HrApplication } from "@/types/careers";
import {
  candidateFullName,
  candidateInitials,
} from "./candidateHelpers";
import { isPipelinePhase, phaseBadgeClasses, phaseLabel } from "./pipeline";

const PAGE_SIZE = 6;

interface JobCandidatesPanelProps {
  jobId: string;
  applications: HrApplication[];
  onOpenCandidate: (application: HrApplication) => void;
  hasFormForJob?: boolean;
  hasSubmittedForCandidate?: (applicationId: string) => boolean;
  onFillQuestionnaire?: (application: HrApplication) => void;
}

/**
 * Compact candidate grid shown when a job card is expanded on the Jobs tab.
 */
export function JobCandidatesPanel({
  jobId,
  applications,
  onOpenCandidate,
}: JobCandidatesPanelProps) {
  const [page, setPage] = useState(1);

  const total = applications.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const applicationsKey = useMemo(
    () => applications.map((item) => item.id).join(","),
    [applications],
  );

  useEffect(() => {
    setPage(1);
  }, [jobId, applicationsKey]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagination = useMemo(
    () => ({
      page: Math.min(page, totalPages),
      limit: PAGE_SIZE,
      total,
      totalPages,
    }),
    [page, total, totalPages],
  );

  const visibleApplications = useMemo(() => {
    const start = (pagination.page - 1) * PAGE_SIZE;
    return applications.slice(start, start + PAGE_SIZE);
  }, [applications, pagination.page]);

  if (applications.length === 0) {
    return (
      <p className="text-sm italic text-muted-foreground">
        No candidates have applied to this role yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recent applicants
        </h4>
        {total > PAGE_SIZE && (
          <p className="text-xs font-medium text-gi-primary">
            Showing {(pagination.page - 1) * PAGE_SIZE + 1}–
            {Math.min(pagination.page * PAGE_SIZE, total)} of {total}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {visibleApplications.map((application) => {
          const phase = isPipelinePhase(application.pipeline_phase)
            ? application.pipeline_phase
            : "received";
          const initials = candidateInitials(application);

          return (
            <button
              key={application.id}
              type="button"
              onClick={() => onOpenCandidate(application)}
              className="group flex items-center gap-3 rounded-lg border border-border-color bg-card-background p-3 text-left transition-colors hover:border-gi-primary/25 hover:bg-muted-background/60"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gi-primary/10 text-sm font-semibold text-gi-primary">
                {initials || "?"}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate text-sm font-bold text-gi-primary">
                  {candidateFullName(application)}
                </p>
                <span
                  className={cn(
                    "mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                    phaseBadgeClasses(phase),
                  )}
                >
                  {phaseLabel(phase)}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-gi-primary" />
            </button>
          );
        })}
      </div>

      <Pagination
        pagination={pagination}
        onPageChange={setPage}
        className="mt-2 justify-end"
      />
    </div>
  );
}
